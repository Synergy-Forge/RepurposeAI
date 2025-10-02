import { Worker, type Processor, type Job } from "bullmq";
import type { Redis } from "ioredis";
import { assertJobPayload, type JobPayload } from "./schema.js";

export interface WorkerConfig {
  connection: Redis;
  concurrency: number;
  retries: number;
}

export interface WorkerHandle {
  worker: Worker<JobPayload>;
  ready: Promise<void>;
  close: () => Promise<void>;
}

const timestamp = () => new Date().toISOString();

export function startWorker(
  queueName: string,
  config: WorkerConfig
): WorkerHandle {
  const { connection, concurrency, retries } = config;

  const processor: Processor<JobPayload> = async (job: Job<JobPayload>) => {
    const payload = assertJobPayload(job.data);
    const attemptsAllowed = job.opts.attempts ?? retries;
    const meta = (payload.data ?? {}) as Record<string, unknown>;
    const simulateFailure = Boolean(meta.simulateFailure);
    const allowedAttempts = Math.max(1, attemptsAllowed ?? retries);
    const shouldFail =
      simulateFailure && job.attemptsMade < allowedAttempts - 1;

    if (shouldFail) {
      throw new Error("simulated failure");
    }

    return {
      processedAt: timestamp(),
      jobIndex: meta.jobIndex,
    };
  };

  const worker = new Worker<JobPayload>(queueName, processor, {
    connection,
    concurrency,
  });

  worker.on("active", (job) => {
    if (!job) return;
    console.log(
      `[${timestamp()}] job ${job.id} started (attempt ${job.attemptsMade + 1}/${job.opts.attempts ?? retries})`
    );
  });

  worker.on("completed", (job) => {
    if (!job) return;
    console.log(
      `[${timestamp()}] job ${job.id} completed after ${job.attemptsMade + 1} attempt(s)`
    );
  });

  worker.on("failed", (job, err) => {
    const jobId = job?.id ?? "unknown";
    const attempts = job ? job.attemptsMade + 1 : "?";
    console.error(
      `[${timestamp()}] job ${jobId} failed on attempt ${attempts}: ${err instanceof Error ? err.message : String(err)}`
    );
  });

  const ready = worker.waitUntilReady().then(() => undefined);

  return {
    worker,
    ready,
    close: async () => {
      await worker.close();
      if (connection.status !== "end") {
        try {
          await connection.quit();
        } catch {
          connection.disconnect();
        }
      }
    },
  };
}
