import "dotenv/config";

import { QueueEvents, Worker } from "bullmq";
import { Prisma } from "@prisma/client";
import IORedis from "ioredis";
import { join, extname } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { unlink as removeFile } from "fs/promises";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

import { prisma } from "@/lib/prisma";
import { sanitizeRedisError } from "@/lib/logging";
import { getBullConnection } from "@/lib/redis/connection";
import {
  VIDEO_QUEUE_NAME,
  VideoProcessingJob,
  ClipReRenderJob,
  AnyVideoQueueJob,
  VideoJobResult,
  isClipReRenderJobName,
} from "@/lib/queues/videoQueue";
import {
  processVideoToExtractKeyMoments,
  createVideoClip,
  DEFAULT_CAPTION_STYLE,
  type TemplateConfig,
  type CaptionStyle,
  type BrandingConfig,
} from "@/lib/video-processing";
import {
  resolveVideoPath,
  resolveStoredPath,
  buildUploadsPath,
  storageProvider,
  createReadStream,
} from "@/lib/storage";
import { EmailService } from "@/lib/email";

type VideoTemplateRow = {
  aspectRatio: string;
  clipLengthMin: number;
  clipLengthMax: number;
  captionStyle: unknown;
  aiPromptOverride: string | null;
  platform: string;
  audience: string;
};

type UserBrandingRow = {
  logoUrl: string | null;
  watermarkEnabled: boolean;
};

/**
 * Downloads a branding logo URL to a temp file that FFmpeg can read locally.
 * Returns the local path plus a cleanup function. Returns null when branding
 * is disabled or the logo URL is missing.
 */
async function resolveBrandingLogo(
  branding: UserBrandingRow | null
): Promise<{ path: string; cleanup: () => Promise<void> } | null> {
  if (!branding?.watermarkEnabled || !branding.logoUrl) {
    return null;
  }

  if (
    branding.logoUrl.startsWith("http://") ||
    branding.logoUrl.startsWith("https://")
  ) {
    const extension = extname(new URL(branding.logoUrl).pathname) || ".png";
    const tempPath = join(tmpdir(), `${randomUUID()}${extension}`);
    const response = await fetch(branding.logoUrl);
    if (!response.ok || !response.body) {
      console.warn(
        `[video-worker] Could not download branding logo (HTTP ${response.status}); skipping watermark.`
      );
      return null;
    }
    await pipeline(
      Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
      createWriteStream(tempPath)
    );
    return {
      path: tempPath,
      cleanup: () => removeFile(tempPath).catch(() => undefined),
    };
  }

  const localPath = resolveStoredPath(branding.logoUrl.replace(/^\//, ""));
  return { path: localPath, cleanup: () => Promise.resolve() };
}

/**
 * Narrows a persisted JSON CaptionStyle back into the typed shape, falling
 * back to DEFAULT_CAPTION_STYLE when the stored value is missing or malformed.
 */
function coerceCaptionStyle(value: unknown): CaptionStyle {
  if (!value || typeof value !== "object") return DEFAULT_CAPTION_STYLE;
  const candidate = value as Partial<CaptionStyle>;
  if (
    typeof candidate.fontSize !== "number" ||
    typeof candidate.fontColor !== "string" ||
    typeof candidate.bgColor !== "string" ||
    typeof candidate.bgOpacity !== "number" ||
    (candidate.position !== "top" &&
      candidate.position !== "center" &&
      candidate.position !== "bottom")
  ) {
    return DEFAULT_CAPTION_STYLE;
  }
  return {
    fontSize: candidate.fontSize,
    fontColor: candidate.fontColor,
    bgColor: candidate.bgColor,
    bgOpacity: candidate.bgOpacity,
    position: candidate.position,
    fontFamily: candidate.fontFamily,
  };
}

/**
 * Assembles a TemplateConfig from the video row, any attached template, and
 * the user's branding settings. Per-video overrides (clipLength, audience,
 * platform, aiPromptOverride) take precedence over the template defaults.
 */
async function buildTemplateConfig(params: {
  userId: string;
  template: VideoTemplateRow | null;
  branding: UserBrandingRow | null;
  overrides: {
    clipLength?: number | null;
    audience?: string | null;
    platform?: string | null;
    aiPromptOverride?: string | null;
  };
  brandingLogoPath?: string;
}): Promise<TemplateConfig> {
  const { template, branding, overrides, brandingLogoPath } = params;

  const brandingConfig: BrandingConfig | undefined =
    branding?.watermarkEnabled && brandingLogoPath
      ? { enabled: true, logoPath: brandingLogoPath }
      : undefined;

  if (!template) {
    return {
      aspectRatios: ["9:16"],
      captionStyle: DEFAULT_CAPTION_STYLE,
      branding: brandingConfig,
      aiPromptOverride: overrides.aiPromptOverride ?? null,
      clipLengthMin: overrides.clipLength ?? undefined,
      clipLengthMax: overrides.clipLength ?? undefined,
      platform: overrides.platform ?? undefined,
      audience: overrides.audience ?? undefined,
    };
  }

  return {
    aspectRatios: [template.aspectRatio],
    captionStyle: coerceCaptionStyle(template.captionStyle),
    branding: brandingConfig,
    aiPromptOverride: overrides.aiPromptOverride ?? template.aiPromptOverride,
    clipLengthMin: overrides.clipLength ?? template.clipLengthMin,
    clipLengthMax: overrides.clipLength ?? template.clipLengthMax,
    platform: overrides.platform ?? template.platform,
    audience: overrides.audience ?? template.audience,
  };
}

/**
 * Handles a full video processing job: resolves template + branding, streams
 * clips through the pipeline, optionally replaces prior clips, writes results
 * atomically, and sends a completion or failure email.
 */
async function runVideoProcessingJob(
  job: import("bullmq").Job<VideoProcessingJob, VideoJobResult>
): Promise<VideoJobResult> {
  const { videoId, userId, originalUrl, options } = job.data;
  const startTime = Date.now();
  let cleanupVideo: () => Promise<void> = () => Promise.resolve();
  let cleanupLogo: () => Promise<void> = () => Promise.resolve();
  let videoRecord: { title: string } | null = null;

  console.log(
    `[video-worker] Processing job ${job.id} for video ${videoId} (user: ${userId})`
  );

  try {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        template: true,
      },
    });

    if (!video) {
      throw new Error(`Video ${videoId} not found`);
    }

    videoRecord = { title: video.title };

    const branding = await prisma.userBranding.findUnique({
      where: { userId },
    });

    const logo = await resolveBrandingLogo(branding);
    if (logo) {
      cleanupLogo = logo.cleanup;
    }

    const templateConfig = await buildTemplateConfig({
      userId,
      template: video.template,
      branding,
      overrides: {
        clipLength: video.clipLength,
        audience: video.audience,
        platform: video.platform,
        aiPromptOverride: video.aiPromptOverride,
      },
      brandingLogoPath: logo?.path,
    });

    // Per-job override: if the caller explicitly set aspectRatios, honor them.
    if (options.aspectRatios?.length) {
      templateConfig.aspectRatios = options.aspectRatios;
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "processing" },
    });

    await job.updateProgress(10);
    await job.log("Status set to processing");

    const { path: videoPath, cleanup } = await resolveVideoPath(originalUrl);
    cleanupVideo = cleanup;
    await job.log(`Processing video: ${videoPath}`);

    await job.updateProgress(20);
    await job.log("Extracting key moments...");

    const { clips: processedClips, transcriptText } =
      await processVideoToExtractKeyMoments(videoPath, templateConfig);

    await job.updateProgress(70);
    await job.log(`${processedClips.length} clips extracted`);

    await job.log("Saving clips to database...");

    const savedClips = await prisma.$transaction(async (tx) => {
      if (options.replaceExistingClips) {
        const oldClips = await tx.videoClip.findMany({
          where: { videoId },
          select: { id: true, videoUrl: true },
        });
        if (oldClips.length) {
          // Delete rows inside the transaction; file cleanup is best-effort below.
          await tx.videoClip.deleteMany({ where: { videoId } });
          // Fire-and-forget storage cleanup outside the tx (can't await inside easily).
          Promise.all(
            oldClips.map((clip) =>
              storageProvider
                .delete(clip.videoUrl.replace(/^\//, ""))
                .catch((err) =>
                  console.error(
                    `[video-worker] Failed to delete old clip ${clip.id}:`,
                    err
                  )
                )
            )
          ).catch(() => undefined);
        }
      }

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
              templateId: video.templateId,
              captionStyle: clip.captionStyle
                ? (clip.captionStyle as unknown as Prisma.InputJsonValue)
                : undefined,
            },
          })
        )
      );

      await tx.video.update({
        where: { id: videoId },
        data: {
          status: "completed",
          transcript: transcriptText,
          updatedAt: new Date(),
        },
      });

      return clips;
    });

    await job.updateProgress(90);
    await job.log(`${savedClips.length} clips saved`);

    await job.updateProgress(100);

    await cleanupVideo();
    await cleanupLogo();
    const duration = Date.now() - startTime;

    console.log(
      `[video-worker] Job ${job.id} completed in ${duration}ms - ${savedClips.length} clips generated`
    );

    try {
      const emailService = new EmailService();
      await emailService.sendProcessingEmail("complete", userId, {
        title: videoRecord.title,
        duration,
        clipsGenerated: savedClips.length,
        downloadUrl: `${process.env.NEXTAUTH_URL ?? ""}/video/${videoId}`,
      });
    } catch (emailErr) {
      console.error(
        "[video-worker] Failed to send completion email:",
        emailErr
      );
    }

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
    await cleanupLogo().catch(() => {});

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

    const isLastAttempt =
      job.attemptsMade >= (job.opts.attempts ?? 3) - 1;

    if (!isLastAttempt) {
      await job.log(
        `Attempt ${job.attemptsMade + 1} failed. Retrying...`
      );
      throw new Error(errorMessage);
    }

    try {
      await prisma.user.update({
        where: { id: userId },
        data: { videosProcessed: { decrement: 1 } },
      });
    } catch (quotaErr) {
      console.error(
        "[video-worker] Failed to refund quota on permanent failure:",
        quotaErr
      );
    }

    try {
      const emailService = new EmailService();
      await emailService.sendProcessingEmail("failed", userId, {
        title: videoRecord?.title ?? "Your video",
        duration: Date.now() - startTime,
        clipsGenerated: 0,
        downloadUrl: "",
      });
    } catch (emailErr) {
      console.error(
        "[video-worker] Failed to send failure email:",
        emailErr
      );
    }

    return {
      success: false,
      videoId,
      clipsGenerated: 0,
      error: errorMessage,
    };
  }
}

/**
 * Handles a single-clip re-render job. Renders a new clip file, swaps the
 * stored URL on the DB row, and deletes the old file on success. Does not
 * touch the parent video's status or other clips.
 */
async function runClipReRenderJob(
  job: import("bullmq").Job<ClipReRenderJob, VideoJobResult>
): Promise<VideoJobResult> {
  const {
    clipId,
    videoId,
    userId,
    startTime,
    endTime,
    aspectRatio,
    captions,
    captionStyle,
    branding,
  } = job.data;

  let cleanupVideo: () => Promise<void> = () => Promise.resolve();
  let cleanupLogo: () => Promise<void> = () => Promise.resolve();
  let tempOutputPath: string | null = null;
  let oldRelativePath: string | null = null;

  const jobStart = Date.now();

  try {
    const clip = await prisma.videoClip.findUnique({
      where: { id: clipId },
      include: {
        video: {
          select: { id: true, userId: true, originalUrl: true },
        },
      },
    });

    if (!clip || clip.video.id !== videoId || clip.video.userId !== userId) {
      throw new Error(`Clip ${clipId} not found or access denied`);
    }

    oldRelativePath = clip.videoUrl.replace(/^\//, "");

    const brandingConfig: BrandingConfig | undefined = branding?.enabled
      ? branding
      : undefined;

    let resolvedBranding: BrandingConfig | undefined = brandingConfig;
    if (branding?.enabled && branding.logoPath?.startsWith("/")) {
      // Stored as public URL — resolve to the actual file the worker can read.
      const userBranding = await prisma.userBranding.findUnique({
        where: { userId },
      });
      const logo = await resolveBrandingLogo(userBranding);
      if (logo) {
        cleanupLogo = logo.cleanup;
        resolvedBranding = { enabled: true, logoPath: logo.path };
      } else {
        resolvedBranding = undefined;
      }
    }

    await job.updateProgress(10);

    const { path: videoPath, cleanup } = await resolveVideoPath(
      clip.video.originalUrl
    );
    cleanupVideo = cleanup;

    const newFileName = `${randomUUID()}_${aspectRatio.replace(":", "x")}.mp4`;
    const newRelativePath = buildUploadsPath("uploads", "clips", newFileName);
    tempOutputPath = join(tmpdir(), newFileName);

    await job.updateProgress(30);

    await createVideoClip(
      videoPath,
      startTime,
      endTime,
      aspectRatio,
      tempOutputPath,
      captions,
      captionStyle,
      resolvedBranding
    );

    await job.updateProgress(70);

    const newUrl = await storageProvider.save(
      createReadStream(tempOutputPath),
      newRelativePath
    );

    await prisma.videoClip.update({
      where: { id: clipId },
      data: {
        startTime,
        endTime,
        aspectRatio,
        captions,
        videoUrl: newUrl,
        captionStyle: captionStyle as unknown as Prisma.InputJsonValue,
        templateId: job.data.templateId ?? null,
      },
    });

    await job.updateProgress(90);

    // Best-effort cleanup of the old clip file
    if (oldRelativePath) {
      await storageProvider
        .delete(oldRelativePath)
        .catch((err) =>
          console.error("[video-worker] Failed to delete old clip file:", err)
        );
    }

    await cleanupVideo();
    await cleanupLogo();
    if (tempOutputPath) {
      await removeFile(tempOutputPath).catch(() => undefined);
    }

    await job.updateProgress(100);

    return {
      success: true,
      videoId,
      clipsGenerated: 1,
      duration: Date.now() - jobStart,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(
      `[video-worker] Clip re-render job ${job.id} failed:`,
      errorMessage
    );

    await cleanupVideo().catch(() => {});
    await cleanupLogo().catch(() => {});
    if (tempOutputPath) {
      await removeFile(tempOutputPath).catch(() => undefined);
    }

    const isLastAttempt =
      job.attemptsMade >= (job.opts.attempts ?? 3) - 1;
    if (!isLastAttempt) {
      throw new Error(errorMessage);
    }

    return {
      success: false,
      videoId,
      clipsGenerated: 0,
      error: errorMessage,
    };
  }
}

export const startVideoWorker = () => {
  console.log("[video-worker] Starting worker...");

  const connection = getBullConnection();

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

  const worker = new Worker<AnyVideoQueueJob, VideoJobResult>(
    VIDEO_QUEUE_NAME,
    async (job) => {
      if (isClipReRenderJobName(job.name)) {
        return runClipReRenderJob(
          job as import("bullmq").Job<ClipReRenderJob, VideoJobResult>
        );
      }
      return runVideoProcessingJob(
        job as import("bullmq").Job<VideoProcessingJob, VideoJobResult>
      );
    },
    {
      connection,
      concurrency: 3,
      limiter: {
        max: 10,
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
        `[video-worker] ✓ Job ${job.id} (${job.name}) completed - ${result.clipsGenerated} clips`
      );
    } else {
      console.log(
        `[video-worker] ✗ Job ${job.id} (${job.name}) completed with errors: ${result.error}`
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

if (typeof require !== "undefined" && require.main === module) {
  startVideoWorker();
}
