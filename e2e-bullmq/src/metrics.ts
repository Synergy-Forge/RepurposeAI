import type { Queue } from "bullmq";

export interface QueueCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export async function collectQueueCounts(queue: Queue): Promise<QueueCounts> {
  const counts = await queue.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused"
  );

  return {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
    paused: counts.paused ?? 0,
  };
}

export interface SummaryInput {
  queue: string;
  counts: QueueCounts;
  jobsRequested: number;
  failRate: number;
  retries: number;
  backoffInitialMs: number;
  pingMs: number;
  durationMs: number;
}

export function summaryJson(input: SummaryInput): void {
  const payload = {
    queue: input.queue,
    counts: input.counts,
    jobs_requested: input.jobsRequested,
    fail_rate: Number(input.failRate.toFixed(4)),
    retries: input.retries,
    backoff_initial_ms: input.backoffInitialMs,
    ping_ms: Number(input.pingMs.toFixed(2)),
    duration_ms: Number(input.durationMs.toFixed(2)),
  };

  console.log(JSON.stringify(payload));
}
