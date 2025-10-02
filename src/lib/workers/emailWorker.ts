import "dotenv/config";

import { QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";

import { sanitizeRedisError, summarizeJobPayload } from "@/lib/logging";
import type { EmailJob } from "@/lib/queues/emailQueue";
import { getBullConnection } from "@/lib/redis/connection";

export const startEmailWorker = () => {
  console.log("[email-worker] Starting worker...");

  const connection = getBullConnection();

  // Create a test Redis connection to verify connectivity and trigger connection logs
  const redisClient = new IORedis(connection.url, {
    tls: connection.tls,
    maxRetriesPerRequest: null,
    connectTimeout: 10000, // 10 seconds timeout
    retryStrategy: (times) => {
      if (times > 3) {
        console.error(
          "[redis] Max connection attempts reached. Please check your Redis configuration."
        );
        return null; // Stop retrying
      }
      const delay = Math.min(times * 200, 2000);
      console.log(
        `[redis] Retrying connection in ${delay}ms... (attempt ${times})`
      );
      return delay;
    },
  });

  redisClient.on("connect", () => {
    console.info("[redis] Connection established");
  });

  redisClient.on("error", (error) => {
    const sanitizedError = sanitizeRedisError(error);
    console.error("[redis] Connection error:", sanitizedError);
  });

  const queueEvents = new QueueEvents("email", { connection });

  const worker = new Worker<EmailJob>(
    "email",
    async (job) => {
      console.log(
        `[email-worker] Processing job ${job.id} - ${summarizeJobPayload(job.data as Record<string, unknown>)}`
      );
    },
    {
      connection,
    }
  );

  worker.on("ready", () => {
    console.log("[email-worker] Worker started");
  });

  worker.on("completed", (job) => {
    console.log(`[email-worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[email-worker] Job ${job?.id ?? "unknown"} failed: ${message}`
    );
  });

  worker.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[email-worker] Worker error", message);
  });

  queueEvents.on("completed", ({ jobId }) => {
    console.log(`[email-worker] Queue event completed for job ${jobId}`);
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(
      `[email-worker] Queue event failed for job ${jobId}: ${failedReason}`
    );
  });

  queueEvents.on("error", (error) => {
    console.error("[email-worker] Queue events error", error);
  });

  return worker;
};

if (typeof require !== "undefined" && require.main === module) {
  startEmailWorker();
}
