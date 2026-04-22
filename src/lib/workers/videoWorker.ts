import "dotenv/config";

import { QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";

import { prisma } from "@/lib/prisma";
import { sanitizeRedisError } from "@/lib/logging";
import { getBullConnection } from "@/lib/redis/connection";
import {
  VIDEO_QUEUE_NAME,
  VideoProcessingJob,
  VideoJobResult,
} from "@/lib/queues/videoQueue";
import { processVideoToExtractKeyMoments } from "@/lib/video-processing";
import { resolveVideoPath } from "@/lib/storage";

export const startVideoWorker = () => {
  console.log("[video-worker] Starting worker...");

  const connection = getBullConnection();

  // Create a test Redis connection to verify connectivity
  const redisClient = new IORedis(connection.url, {
    tls: connection.tls,
    maxRetriesPerRequest: null,
    connectTimeout: 10_000,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error(
          "[redis] Max connection attempts reached. Please check your Redis configuration."
        );
        return null;
      }
      const delay = Math.min(times * 200, 2_000);
      console.log(
        `[redis] Retrying connection in ${delay}ms... (attempt ${times})`
      );
      return delay;
    },
  });

  redisClient.on("connect", () => {
    console.info("[redis] Connection established for video worker");
  });

  redisClient.on("error", (error) => {
    const sanitizedError = sanitizeRedisError(error);
    console.error("[redis] Connection error:", sanitizedError);
  });

  const queueEvents = new QueueEvents(VIDEO_QUEUE_NAME, { connection });

  const worker = new Worker<VideoProcessingJob, VideoJobResult>(
    VIDEO_QUEUE_NAME,
    async (job) => {
      const { videoId, userId, originalUrl, options: _options } = job.data;
      const startTime = Date.now();
      let cleanupVideo: () => Promise<void> = () => Promise.resolve();

      console.log(
        `[video-worker] Processing job ${job.id} for video ${videoId} (user: ${userId})`
      );

      try {
        // 1. Atualizar status para processing
        await prisma.video.update({
          where: { id: videoId },
          data: { status: "processing" },
        });

        await job.updateProgress(10);
        await job.log("Status atualizado para processing");

        // 2. Resolve video to a local path (downloads from R2 if the URL is remote)
        const { path: videoPath, cleanup } = await resolveVideoPath(originalUrl);
        cleanupVideo = cleanup;
        await job.log(`Processando vídeo: ${videoPath}`);

        // 3. Processar vídeo para extrair clips
        await job.updateProgress(20);
        await job.log("Iniciando extração de clips...");

        const processedClips = await processVideoToExtractKeyMoments(videoPath);

        await job.updateProgress(70);
        await job.log(`${processedClips.length} clips extraídos`);

        // 4. Salvar clips e marcar como completed atomicamente
        await job.log("Salvando clips no banco de dados...");

        const savedClips = await prisma.$transaction(async (tx) => {
          const clips = await Promise.all(
            processedClips.map((clip) =>
              tx.videoClip.create({
                data: {
                  title: clip.title,
                  description: clip.description,
                  startTime: clip.startTime,
                  endTime: clip.endTime,
                  aspectRatio: clip.aspectRatio,
                  videoUrl: clip.videoUrl,
                  captions: clip.captions,
                  hashtags: clip.hashtags,
                  videoId,
                },
              })
            )
          );

          await tx.video.update({
            where: { id: videoId },
            data: { status: "completed", updatedAt: new Date() },
          });

          return clips;
        });

        await job.updateProgress(90);
        await job.log(`${savedClips.length} clips salvos`);

        await job.updateProgress(100);

        await cleanupVideo();
        const duration = Date.now() - startTime;

        console.log(
          `[video-worker] Job ${job.id} completed in ${duration}ms - ${savedClips.length} clips generated`
        );

        return {
          success: true,
          videoId,
          clipsGenerated: savedClips.length,
          duration,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        console.error(
          `[video-worker] Job ${job.id} failed for video ${videoId}:`,
          errorMessage
        );

        await cleanupVideo().catch(() => {});

        // Atualizar status para failed no banco
        try {
          await prisma.video.update({
            where: { id: videoId },
            data: {
              status: "failed",
              updatedAt: new Date(),
            },
          });
        } catch (dbError) {
          console.error(
            "[video-worker] Error updating video status to failed:",
            dbError
          );
        }

        // Se não for a última tentativa, lançar erro para retry
        if (job.attemptsMade < (job.opts.attempts || 3)) {
          await job.log(
            `Tentativa ${job.attemptsMade + 1} falhou. Tentando novamente...`
          );
          throw new Error(errorMessage);
        }

        // Na última tentativa, retornar resultado com erro
        return {
          success: false,
          videoId,
          clipsGenerated: 0,
          error: errorMessage,
        };
      }
    },
    {
      connection,
      concurrency: 3, // Processar até 3 vídeos simultaneamente
      limiter: {
        max: 10, // Máximo 10 jobs por minuto
        duration: 60000,
      },
    }
  );

  worker.on("ready", () => {
    console.log("[video-worker] Worker started and ready");
  });

  worker.on("completed", (job, result) => {
    if (result.success) {
      console.log(
        `[video-worker] ✓ Job ${job.id} completed successfully - ${result.clipsGenerated} clips`
      );
    } else {
      console.log(
        `[video-worker] ✗ Job ${job.id} completed with errors: ${result.error}`
      );
    }
  });

  worker.on("failed", (job, error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[video-worker] ✗ Job ${job?.id ?? "unknown"} failed permanently: ${message}`
    );
  });

  worker.on("error", (error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[video-worker] Worker error:", message);
  });

  worker.on("stalled", (jobId) => {
    console.warn(
      `[video-worker] Job ${jobId} stalled (worker may have crashed)`
    );
  });

  queueEvents.on("completed", ({ jobId }) => {
    console.log(`[video-worker] Queue event: Job ${jobId} completed`);
  });

  queueEvents.on("failed", ({ jobId, failedReason }) => {
    console.error(
      `[video-worker] Queue event: Job ${jobId} failed - ${failedReason}`
    );
  });

  queueEvents.on("progress", ({ jobId, data }) => {
    console.log(`[video-worker] Job ${jobId} progress: ${data}%`);
  });

  queueEvents.on("error", (error) => {
    console.error("[video-worker] Queue events error:", error);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(
      `[video-worker] ${signal} received, shutting down gracefully...`
    );
    try {
      await worker.close();
      await queueEvents.close();
      await redisClient.quit();
      await prisma.$disconnect();
      console.log("[video-worker] Shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("[video-worker] Error during shutdown:", error);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  return { worker, queueEvents, redisClient };
};

// Executar worker se for o arquivo principal
if (typeof require !== "undefined" && require.main === module) {
  startVideoWorker();
}
