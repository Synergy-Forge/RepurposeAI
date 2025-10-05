import 'dotenv/config';

import { QueueEvents, Worker } from 'bullmq';
import IORedis from 'ioredis';

import { EmailService } from '@/lib/email';
import { sanitizeRedisError } from '@/lib/logging';
import { EMAIL_QUEUE_NAME, EmailJob } from '@/lib/queues/emailQueue';
import { getBullConnection } from '@/lib/redis/connection';

export const startEmailWorker = () => {
  console.log('[email-worker] Starting worker...');

  const connection = getBullConnection();
  const emailService = new EmailService();

  // Create a test Redis connection to verify connectivity and trigger connection logs
  const redisClient = new IORedis(connection.url, {
    tls: connection.tls,
    maxRetriesPerRequest: null,
    connectTimeout: 10_000,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('[redis] Max connection attempts reached. Please check your Redis configuration.');
        return null;
      }
      const delay = Math.min(times * 200, 2_000);
      console.log(`[redis] Retrying connection in ${delay}ms... (attempt ${times})`);
      return delay;
    },
  });

  redisClient.on('connect', () => {
    console.info('[redis] Connection established');
  });

  redisClient.on('error', (error) => {
    const sanitizedError = sanitizeRedisError(error);
    console.error('[redis] Connection error:', sanitizedError);
  });

  const queueEvents = new QueueEvents(EMAIL_QUEUE_NAME, { connection });

  const worker = new Worker<EmailJob>(
    EMAIL_QUEUE_NAME,
    async (job) => {
      console.log(`[email-worker] Processing job ${job.id} (${job.data.type}) -> ${job.data.options.to}`);
      const success = await emailService.deliverQueuedEmail(job.data);
      if (!success) {
        throw new Error(`Email delivery failed for ${job.data.options.to}`);
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('ready', () => {
    console.log('[email-worker] Worker started');
  });

  worker.on('completed', (job) => {
    console.log(`[email-worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email-worker] Job ${job?.id ?? 'unknown'} failed: ${message}`);
  });

  worker.on('error', (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[email-worker] Worker error', message);
  });

  queueEvents.on('completed', ({ jobId }) => {
    console.log(`[email-worker] Queue event completed for job ${jobId}`);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    console.error(`[email-worker] Queue event failed for job ${jobId}: ${failedReason}`);
  });

  queueEvents.on('error', (error) => {
    console.error('[email-worker] Queue events error', error);
  });

  const shutdown = async (signal: string) => {
    console.log(`[email-worker] ${signal} received, shutting down gracefully...`);
    try {
      await worker.close();
      await queueEvents.close();
      await redisClient.quit();
      console.log('[email-worker] Shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('[email-worker] Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return { worker, queueEvents, redisClient };
};

if (typeof require !== 'undefined' && require.main === module) {
  startEmailWorker();
}
