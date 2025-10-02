import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import { assertJobPayload, makeJobData } from "./schema.js";

export interface ProducerConfig {
  queueName: string;
  redis: Redis;
  retries: number;
  backoffInitialMs: number;
}

export function createQueue(config: ProducerConfig): Queue {
  const { queueName, redis, retries, backoffInitialMs } = config;

  return new Queue(queueName, {
    connection: redis,
    defaultJobOptions: {
      attempts: retries,
      backoff: {
        type: "exponential",
        delay: backoffInitialMs,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  });
}

export async function produce(
  queue: Queue,
  totalJobs: number,
  failRate: number
): Promise<string[]> {
  const jobIds: string[] = [];

  for (let index = 0; index < totalJobs; index += 1) {
    const shouldFail = determineSimulatedFailure(index, failRate);
    const payload = makeJobData(index, shouldFail);
    assertJobPayload(payload);

    const job = await queue.add(`job-${index}`, payload);
    jobIds.push(String(job.id));
  }

  return jobIds;
}

function determineSimulatedFailure(index: number, failRate: number): boolean {
  if (!Number.isFinite(failRate) || failRate <= 0) {
    return false;
  }
  if (failRate >= 1) {
    return true;
  }
  const interval = Math.max(1, Math.round(1 / failRate));
  return index % interval === 0;
}
