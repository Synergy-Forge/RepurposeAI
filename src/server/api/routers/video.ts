import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc";
import { statfs, writeFile, unlink } from "fs/promises";
import { randomUUID } from "crypto";
import { fileTypeFromBuffer } from "file-type";
import { dirname } from "path";
import { TRPCError } from "@trpc/server";
import {
  ensureDirectory,
  storagePaths,
  buildUploadsPath,
  toPublicUrl,
  resolveStoredPath,
} from "@/lib/storage";
import {
  enqueueVideoProcessing,
  getVideoJobStatus,
  getVideoQueueMetrics,
} from "@/lib/queues/videoQueue";

const MB = 1024 * 1024;
const GB = MB * 1024;
const MIN_FREE_DISK_AFTER_UPLOAD = 500 * MB;

const SUBSCRIPTION_UPLOAD_LIMITS: Record<string, number> = {
  free: 100 * MB,
  basic: 500 * MB,
  pro: 2 * GB,
  enterprise: 5 * GB,
  default: 500 * MB,
};

const ALLOWED_VIDEO_MIME_TYPES = new Set<string>([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/x-msvideo",
  "video/avi",
]);

const uploadVideoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  videoData: z.string(), // Base64 encoded video data
});

const processVideoSchema = z.object({
  videoId: z.string(),
});

async function safeUnlink(filePath: string) {
  try {
    await unlink(filePath);
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code !== "ENOENT") {
      console.error(`Error removing file at ${filePath}:`, error);
    }
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(2)}${units[exponent]}`;
}

async function assertSufficientDiskSpace(
  absoluteTargetPath: string,
  requiredBytes: number
) {
  const targetDir = dirname(absoluteTargetPath);

  try {
    const stats = await statfs(targetDir);
    const availableBytes = stats.bavail * stats.bsize;

    if (availableBytes - requiredBytes < MIN_FREE_DISK_AFTER_UPLOAD) {
      const requiredTotal = requiredBytes + MIN_FREE_DISK_AFTER_UPLOAD;
      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: `Insufficient disk space. Available: ${formatBytes(
          availableBytes
        )}, required: ${formatBytes(requiredTotal)}`,
      });
    }
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err?.code === "ENOSYS" || err?.code === "EINVAL") {
      console.warn(
        `[video:upload] Disk space check not supported on this platform (${err.code}). Skipping validation.`
      );
      return;
    }

    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to verify disk space availability",
      cause: error,
    });
  }
}

export const videoRouter = createTRPCRouter({
  uploadVideo: protectedProcedure
    .input(uploadVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const { title, description, videoData } = input;
      const userId = ctx.session.user.id;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          subscriptionStatus: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Decode base64 video data
      const videoBuffer = Buffer.from(videoData, "base64");

      const detectedType = await fileTypeFromBuffer(videoBuffer);

      if (!detectedType || !ALLOWED_VIDEO_MIME_TYPES.has(detectedType.mime)) {
        const allowedFormats = Array.from(ALLOWED_VIDEO_MIME_TYPES)
          .map((type) => type.split("/")[1])
          .join(", ");
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported video format${
            detectedType?.mime ? ` (${detectedType.mime})` : ""
          }. Allowed formats: ${allowedFormats}`,
        });
      }

      const subscriptionPlan = user.subscriptionStatus?.toLowerCase() ?? "free";
      const maxUploadSizeBytes =
        SUBSCRIPTION_UPLOAD_LIMITS[subscriptionPlan] ??
        SUBSCRIPTION_UPLOAD_LIMITS.default;

      if (videoBuffer.length > maxUploadSizeBytes) {
        const sizeInMb = (videoBuffer.length / MB).toFixed(2);
        const limitInMb = (maxUploadSizeBytes / MB).toFixed(0);
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `Video size (${sizeInMb}MB) exceeds the ${subscriptionPlan} plan limit of ${limitInMb}MB`,
        });
      }

      const videoFileExtension = detectedType.ext ?? "mp4";
      const videoFileName = `${randomUUID()}.${videoFileExtension}`;
      const relativeVideoPath = buildUploadsPath(
        "uploads",
        "videos",
        videoFileName
      );
      const absoluteVideoPath = resolveStoredPath(relativeVideoPath);

      await ensureDirectory(storagePaths.originalsDir);
      await assertSufficientDiskSpace(absoluteVideoPath, videoBuffer.length);

      let persistedVideoPath: string | null = null;

      try {
        console.info("[video:upload] starting", {
          userId,
          title,
          subscriptionPlan,
          sizeBytes: videoBuffer.length,
        });

        await writeFile(absoluteVideoPath, videoBuffer);
        persistedVideoPath = absoluteVideoPath;

        const publicVideoUrl = toPublicUrl(relativeVideoPath);

        const video = await ctx.prisma.video.create({
          data: {
            id: randomUUID(),
            title,
            description,
            originalUrl: publicVideoUrl,
            userId,
            status: "uploading",
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          videoId: video.id,
          message: "Video uploaded successfully",
        };
      } catch (error) {
        if (persistedVideoPath) {
          await safeUnlink(persistedVideoPath);
        }
        console.error("[video:upload] failed", {
          userId,
          error,
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload video",
          cause: error,
        });
      }
    }),

  processVideo: protectedProcedure
    .input(processVideoSchema)
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      // Check user's video quota before processing
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: {
          videosProcessed: true,
          videoQuotaLimit: true,
          subscriptionStatus: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Enforce quota limit
      if (user.videosProcessed >= user.videoQuotaLimit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Video processing quota exceeded. You have processed ${user.videosProcessed}/${user.videoQuotaLimit} videos. Please upgrade your plan to process more videos.`,
        });
      }

      // Get video from database
      const video = await ctx.prisma.video.findFirst({
        where: {
          id: videoId,
          userId,
        },
      });

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      // Reserve quota atomically
      const reserveResult = Number(
        await ctx.prisma.$executeRaw`
          UPDATE "User"
          SET "videosProcessed" = "videosProcessed" + 1
          WHERE "id" = ${userId} AND "videosProcessed" < "videoQuotaLimit"
        `
      );

      if (reserveResult === 0) {
        const latestUser = await ctx.prisma.user.findUnique({
          where: { id: userId },
          select: {
            videosProcessed: true,
            videoQuotaLimit: true,
          },
        });

        const processedCount =
          latestUser?.videosProcessed ?? user.videosProcessed;
        const quotaLimit = latestUser?.videoQuotaLimit ?? user.videoQuotaLimit;

        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Video processing quota exceeded. You have processed ${processedCount}/${quotaLimit} videos. Please upgrade your plan to process more videos.`,
        });
      }

      try {
        console.info("[video:process] enqueuing job", {
          userId,
          videoId,
        });

        // Enfileirar vídeo para processamento assíncrono
        const job = await enqueueVideoProcessing({
          videoId,
          userId,
          originalUrl: video.originalUrl,
          options: {
            generateClips: true,
            transcribe: false, // TODO: Implementar transcrição
            generateHashtags: true,
          },
        });

        // Atualizar status para queued
        await ctx.prisma.video.update({
          where: { id: videoId },
          data: { status: "processing" },
        });

        console.info("[video:process] job enqueued", {
          userId,
          videoId,
          jobId: job.id,
        });

        return {
          success: true,
          jobId: job.id,
          videoId,
          message:
            "Video queued for processing. You will be notified when it's ready.",
        };
      } catch (error) {
        // Rollback quota if enqueue fails
        try {
          await ctx.prisma.user.update({
            where: { id: userId },
            data: {
              videosProcessed: {
                decrement: 1,
              },
            },
          });
        } catch (quotaError) {
          console.error("Error rolling back video quota:", quotaError);
        }

        console.error("[video:process] failed to enqueue", {
          userId,
          videoId,
          error,
        });

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to queue video for processing",
          cause: error,
        });
      }
    }),

  getUserVideos: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const videos = await ctx.prisma.video.findMany({
      where: { userId },
      include: {
        videoClips: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return videos;
  }),

  getVideoWithClips: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      const video = await ctx.prisma.video.findFirst({
        where: {
          id: videoId,
          userId,
        },
        include: {
          videoClips: true,
        },
      });

      if (!video) {
        throw new Error("Video not found");
      }

      return video;
    }),

  deleteVideo: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      // Check if video belongs to user
      const video = await ctx.prisma.video.findFirst({
        where: {
          id: videoId,
          userId,
        },
        include: {
          videoClips: true,
        },
      });

      if (!video) {
        throw new Error("Video not found");
      }

      try {
        // Delete video and all associated clips
        await ctx.prisma.video.delete({
          where: { id: videoId },
        });

        const fileTargets = [
          video.originalUrl,
          ...(video.videoClips ?? []).map((clip) => clip.videoUrl),
        ]
          .filter(
            (storedPath): storedPath is string =>
              Boolean(storedPath) && !/^https?:\/\//i.test(storedPath)
          )
          .map((storedPath) => resolveStoredPath(storedPath));

        await Promise.all(fileTargets.map((path) => safeUnlink(path)));

        return {
          success: true,
          message: "Video deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting video:", error);
        throw new Error("Failed to delete video");
      }
    }),

  getVideoProcessingStatus: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .output(
      z.object({
        status: z.enum(["queued", "processing", "completed", "failed"]),
        progress: z.number().nullable(),
        error: z.string().nullable(),
        jobId: z.string().nullish(),
        updatedAt: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { videoId } = input;
      const userId = ctx.session.user.id;

      try {
        // Verificar se o vídeo pertence ao usuário
        const video = await ctx.prisma.video.findFirst({
          where: {
            id: videoId,
            userId,
          },
          select: {
            id: true,
            status: true,
            updatedAt: true,
          },
        });

        if (!video) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Video not found",
          });
        }

        // Obter status do job na fila (pode ser null)
        const jobStatus = await getVideoJobStatus(videoId);

        // Mapear estados do BullMQ para nosso contrato
        const mapState = (vStatus: string, jState?: string | null) => {
          // Estados finais priorizam o status do vídeo em DB
          if (vStatus === "completed") return "completed" as const;
          if (vStatus === "failed") return "failed" as const;

          // Sem job conhecido: considerar queued por padrão
          if (!jState) return "queued" as const;

          switch (jState) {
            case "active":
              return "processing" as const;
            case "waiting":
            case "delayed":
            case "paused":
            case "waiting-children":
              return "queued" as const;
            case "completed":
              return "completed" as const;
            case "failed":
              return "failed" as const;
            default:
              return "queued" as const;
          }
        };

        const status = mapState(video.status, jobStatus?.state ?? null);

        const progress =
          status === "completed"
            ? 100
            : typeof jobStatus?.progress === "number"
              ? Math.max(0, Math.min(100, Number(jobStatus.progress)))
              : null;

        const error =
          status === "failed" ? (jobStatus?.failedReason ?? null) : null;

        return {
          status,
          progress,
          error,
          jobId: jobStatus?.jobId ?? null,
          updatedAt: video.updatedAt.toISOString(),
        };
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get video processing status",
          cause: err,
        });
      }
    }),

  getQueueMetrics: protectedProcedure.query(async () => {
    const metrics = await getVideoQueueMetrics();
    return metrics;
  }),
});
