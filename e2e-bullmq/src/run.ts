import { performance } from "node:perf_hooks";
import type { Job, Worker, Queue } from "bullmq";
import { getRuntimeParams, getRedisConnection, pingLatency } from "./config.js";
import { collectQueueCounts, summaryJson } from "./metrics.js";
import { createQueue, produce } from "./producer.js";
import { simulateConnectionFault } from "./simulate_connection_fault.js";
import { startWorker } from "./worker.js";
import type { JobPayload } from "./schema.js";

interface CliArgs {
  jobs?: number;
  failRate?: number;
  queue?: string;
  concurrency?: number;
  badUrl?: string;
  backoffInitial?: number;
  retries?: number;
}

const timestamp = () => new Date().toISOString();

function parseCliArgs(argv: string[]): CliArgs {
  const result: CliArgs = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    switch (arg) {
      case "--jobs":
        result.jobs = next ? Number(next) : undefined;
        index += 1;
        break;
      case "--fail-rate":
        result.failRate = next ? Number(next) : undefined;
        index += 1;
        break;
      case "--queue":
        result.queue = next;
        index += 1;
        break;
      case "--concurrency":
        result.concurrency = next ? Number(next) : undefined;
        index += 1;
        break;
      case "--bad-url":
        result.badUrl = next;
        index += 1;
        break;
      case "--backoff-initial":
        result.backoffInitial = next ? Number(next) : undefined;
        index += 1;
        break;
      case "--retries":
        result.retries = next ? Number(next) : undefined;
        index += 1;
        break;
      default:
        break;
    }
  }
  return result;
}

function clampFailRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

async function waitForSettlement(
  worker: Worker<JobPayload>,
  totalJobs: number,
  retries: number
) {
  return new Promise<{ completed: number; failed: number }>((resolve) => {
    let completed = 0;
    let failed = 0;
    const finalized = new Set<string>();

    const cleanup = () => {
      worker.off("completed", completedListener);
      worker.off("failed", failedListener);
    };

    const tryResolve = () => {
      if (completed + failed >= totalJobs) {
        cleanup();
        resolve({ completed, failed });
      }
    };

    const completedListener = (job: Job<JobPayload>) => {
      if (!job) {
        return;
      }
      const id = String(job.id);
      if (finalized.has(id)) {
        return;
      }
      finalized.add(id);
      completed += 1;
      tryResolve();
    };

    const failedListener = (
      job: Job<JobPayload> | undefined,
      _error: Error
    ) => {
      if (!job) {
        return;
      }
      const id = String(job.id);
      const attemptsAllowed = Math.max(1, job.opts.attempts ?? retries);
      if (job.attemptsMade >= attemptsAllowed) {
        if (!finalized.has(id)) {
          finalized.add(id);
          failed += 1;
        }
      }
      tryResolve();
    };

    worker.on("completed", completedListener);
    worker.on("failed", failedListener);
  });
}

async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));
  const base = getRuntimeParams();

  const jobs = args.jobs ?? base.jobs;
  const failRate = clampFailRate(args.failRate ?? base.failRate);
  const concurrency = Math.max(1, args.concurrency ?? base.concurrency);
  const retries = Math.max(1, args.retries ?? base.retries);
  const backoffInitialMs = Math.max(
    0,
    args.backoffInitial ?? base.backoffInitialMs
  );
  const queuePrefix = args.queue ?? base.queueName;
  const queueName = `${queuePrefix}:${Date.now()}`;

  if (args.badUrl) {
    await simulateConnectionFault(args.badUrl);
  }

  console.log(
    `[${timestamp()}] Iniciando ciclo com queue=${queueName}, jobs=${jobs}, failRate=${failRate}, concurrency=${concurrency}, retries=${retries}, backoffInitial=${backoffInitialMs}ms`
  );

  const start = performance.now();

  const queueConnection = getRedisConnection();
  const workerConnection = getRedisConnection();
  let queue: Queue | undefined;
  let workerHandle: ReturnType<typeof startWorker> | undefined;
  let pingMs = 0;

  try {
    pingMs = await pingLatency(queueConnection);
    console.log(
      `[${timestamp()}] Latência de PING inicial: ${pingMs.toFixed(2)} ms`
    );

    queue = createQueue({
      queueName,
      redis: queueConnection,
      retries,
      backoffInitialMs,
    });
    await queue.waitUntilReady();

    workerHandle = startWorker(queueName, {
      connection: workerConnection,
      concurrency,
      retries,
    });
    await workerHandle.ready;

    const settlementPromise = waitForSettlement(
      workerHandle.worker,
      jobs,
      retries
    );

    const jobIds = await produce(queue, jobs, failRate);
    console.log(`[${timestamp()}] ${jobIds.length} job(s) enfileirados.`);

    const { completed, failed } = await settlementPromise;
    console.log(
      `[${timestamp()}] Processamento concluído. Completados=${completed}, Falhados=${failed} (após retries).`
    );

    const counts = await collectQueueCounts(queue);
    const durationMs = performance.now() - start;

    summaryJson({
      queue: queueName,
      counts,
      jobsRequested: jobs,
      failRate,
      retries,
      backoffInitialMs,
      pingMs,
      durationMs,
    });
  } finally {
    if (workerHandle) {
      await workerHandle.close().catch(() => undefined);
    }

    if (workerConnection.status !== "end") {
      await workerConnection.quit().catch(() => workerConnection.disconnect());
    }

    if (queue) {
      await queue.drain(true).catch(() => undefined);
      await queue.close().catch(() => undefined);
    }

    if (queueConnection.status !== "end") {
      await queueConnection.quit().catch(() => queueConnection.disconnect());
    }
  }
}

main().catch((error) => {
  console.error(`[${timestamp()}] Erro fatal no ciclo E2E:`, error);
  process.exitCode = 1;
});
