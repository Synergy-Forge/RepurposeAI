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
  enqueueClipReRender,
  getVideoJobStatus,
  getVideoQueueMetrics,
} from "@/lib/queues/videoQueue";
import {
  DEFAULT_CAPTION_STYLE,
  type CaptionStyle,
  type BrandingConfig,
} from "@/lib/video-processing";

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

const ALLOWED_AUDIENCES = ["general", "business", "educational", "entertainment"] as const;
const ALLOWED_PLATFORMS = ["youtube", "tiktok", "instagram", "linkedin", "twitter"] as const;

const processVideoSchema = z.object({
  videoId: z.string(),
  templateSlug: z.string().optional(),
  clipLength: z.number().int().min(10).max(300).optional(),
  audience: z.enum(ALLOWED_AUDIENCES).optional(),
  platform: z.enum(ALLOWED_PLATFORMS).optional(),
});

const processWithOptionsSchema = z.object({
  videoId: z.string(),
  templateSlug: z.string().optional(),
  clipLength: z.number().int().min(10).max(300).optional(),
  audience: z.enum(ALLOWED_AUDIENCES).optional(),
  platform: z.enum(ALLOWED_PLATFORMS).optional(),
});

const captionPositionSchema = z.enum(["top", "center", "bottom"]);
const captionStyleSchema = z.object({
  fontSize: z.number().int().min(12).max(200),
  fontColor: z.string().min(1),
  bgColor: z.string().min(1),
  bgOpacity: z.number().min(0).max(1),
  position: captionPositionSchema,
  fontFamily: z.string().optional(),
});

const reRenderClipSchema = z.object({
  clipId: z.string(),
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  aspectRatio: z.enum(["9:16", "1:1", "16:9"]),
  captions: z.string(),
  captionStyle: captionStyleSchema.optional(),
  templateSlug: z.string().optional(),
});

const clipOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  aspectRatio: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  videoUrl: z.string(),
  captions: z.string().nullable(),
  hashtags: z.string().nullable(),
});

const videoSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["uploading", "processing", "completed", "failed"]),
  originalUrl: z.string(),
  createdAt: z.date(),
});

const getVideoWithClipsOutputSchema = z.object({
  video: videoSummarySchema,
  clips: z.array(clipOutputSchema),
  updatedAt: z.date(),
  duration: z.number().nonnegative(),
});

type VideoStatus = z.infer<typeof videoSummarySchema>["status"];

const allowedVideoStatuses: VideoStatus[] = [
  "uploading",
  "processing",
  "completed",
  "failed",
];

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
      const { videoId, templateSlug, clipLength, audience, platform } = input;
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

      // Optionally resolve + apply a template and per-video overrides before enqueueing
      let resolvedTemplateId: string | null | undefined;
      if (templateSlug) {
        const template = await ctx.prisma.videoTemplate.findUnique({
          where: { slug: templateSlug },
          select: { id: true },
        });
        if (!template) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Unknown template: ${templateSlug}`,
          });
        }
        resolvedTemplateId = template.id;
      }

      const hasOverrides =
        resolvedTemplateId !== undefined ||
        clipLength !== undefined ||
        audience !== undefined ||
        platform !== undefined;

      if (hasOverrides) {
        await ctx.prisma.video.update({
          where: { id: videoId },
          data: {
            ...(resolvedTemplateId !== undefined
              ? { templateId: resolvedTemplateId }
              : {}),
            ...(clipLength !== undefined ? { clipLength } : {}),
            ...(audience !== undefined ? { audience } : {}),
            ...(platform !== undefined ? { platform } : {}),
          },
        });
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

        const job = await enqueueVideoProcessing({
          videoId,
          userId,
          originalUrl: video.originalUrl,
          options: {
            generateClips: true,
            transcribe: true,
            generateHashtags: true,
          },
        });

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

  processWithOptions: protectedProcedure
    .input(processWithOptionsSchema)
    .mutation(async ({ ctx, input }) => {
      const { videoId, templateSlug, clipLength, audience, platform } = input;
      const userId = ctx.session.user.id;

      const video = await ctx.prisma.video.findFirst({
        where: { id: videoId, userId },
      });

      if (!video) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      let resolvedTemplateId: string | null | undefined;
      if (templateSlug) {
        const template = await ctx.prisma.videoTemplate.findUnique({
          where: { slug: templateSlug },
          select: { id: true },
        });
        if (!template) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Unknown template: ${templateSlug}`,
          });
        }
        resolvedTemplateId = template.id;
      }

      await ctx.prisma.video.update({
        where: { id: videoId },
        data: {
          status: "processing",
          ...(resolvedTemplateId !== undefined
            ? { templateId: resolvedTemplateId }
            : {}),
          ...(clipLength !== undefined ? { clipLength } : {}),
          ...(audience !== undefined ? { audience } : {}),
          ...(platform !== undefined ? { platform } : {}),
        },
      });

      try {
        const job = await enqueueVideoProcessing({
          videoId,
          userId,
          originalUrl: video.originalUrl,
          options: {
            generateClips: true,
            transcribe: true,
            generateHashtags: true,
            replaceExistingClips: true,
          },
        });

        return {
          success: true,
          jobId: job.id,
          videoId,
          message: "Video re-processing queued. Existing clips will be replaced when new clips are ready.",
        };
      } catch (error) {
        console.error("[video:processWithOptions] failed to enqueue", {
          userId,
          videoId,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to queue video for re-processing",
          cause: error,
        });
      }
    }),

  reRenderClip: protectedProcedure
    .input(reRenderClipSchema)
    .mutation(async ({ ctx, input }) => {
      const { clipId, startTime, endTime, aspectRatio, captions, captionStyle, templateSlug } = input;
      const userId = ctx.session.user.id;

      if (endTime <= startTime) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "endTime must be greater than startTime",
        });
      }

      const clip = await ctx.prisma.videoClip.findUnique({
        where: { id: clipId },
        include: {
          video: {
            select: { id: true, userId: true, duration: true },
          },
        },
      });

      if (!clip || clip.video.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Clip not found" });
      }

      const videoDuration = clip.video.duration;
      if (videoDuration && endTime > videoDuration + 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `endTime (${endTime}s) exceeds video duration (${videoDuration}s).`,
        });
      }

      let resolvedTemplateId: string | null = null;
      let resolvedCaptionStyle: CaptionStyle = captionStyle ?? DEFAULT_CAPTION_STYLE;
      if (templateSlug) {
        const template = await ctx.prisma.videoTemplate.findUnique({
          where: { slug: templateSlug },
        });
        if (!template) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Unknown template: ${templateSlug}`,
          });
        }
        resolvedTemplateId = template.id;
        if (!captionStyle) {
          resolvedCaptionStyle = template.captionStyle as unknown as CaptionStyle;
        }
      } else if (clip.templateId) {
        resolvedTemplateId = clip.templateId;
      }

      const branding = await ctx.prisma.userBranding.findUnique({
        where: { userId },
      });

      const brandingConfig: BrandingConfig | undefined =
        branding?.watermarkEnabled && branding.logoUrl
          ? { enabled: true, logoPath: branding.logoUrl }
          : undefined;

      try {
        const job = await enqueueClipReRender({
          clipId,
          userId,
          videoId: clip.video.id,
          startTime,
          endTime,
          aspectRatio,
          captions,
          captionStyle: resolvedCaptionStyle,
          branding: brandingConfig,
          templateId: resolvedTemplateId,
        });

        return {
          success: true,
          jobId: job.id,
          clipId,
          message: "Clip re-render queued.",
        };
      } catch (error) {
        console.error("[video:reRenderClip] failed to enqueue", {
          userId,
          clipId,
          error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to queue clip for re-rendering",
          cause: error,
        });
      }
    }),

  getAllUserClips: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    return ctx.prisma.videoClip.findMany({
      where: { video: { userId } },
      include: {
        video: { select: { id: true, title: true, duration: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }),

  getClipForEditor: protectedProcedure
    .input(z.object({ clipId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const clip = await ctx.prisma.videoClip.findUnique({
        where: { id: input.clipId },
        include: {
          video: {
            select: {
              id: true,
              title: true,
              duration: true,
              userId: true,
              originalUrl: true,
            },
          },
          template: true,
        },
      });

      if (!clip || clip.video.userId !== userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Clip not found" });
      }

      return {
        id: clip.id,
        title: clip.title,
        description: clip.description,
        startTime: clip.startTime,
        endTime: clip.endTime,
        aspectRatio: clip.aspectRatio,
        videoUrl: clip.videoUrl,
        captions: clip.captions,
        hashtags: clip.hashtags,
        captionStyle: clip.captionStyle as unknown as CaptionStyle | null,
        templateSlug: clip.template?.slug ?? null,
        video: {
          id: clip.video.id,
          title: clip.video.title,
          duration: clip.video.duration,
          originalUrl: clip.video.originalUrl,
        },
      };
    }),

  getUserVideos: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { cursor, limit } = input;

      const videos = await ctx.prisma.video.findMany({
        where: { userId },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        include: { videoClips: true },
        orderBy: { createdAt: "desc" },
      });

      const nextCursor =
        videos.length > limit ? videos.pop()!.id : undefined;

      return { videos, nextCursor };
    }),

  getVideoWithClips: protectedProcedure
    .input(z.object({ videoId: z.string() }))
    .output(getVideoWithClipsOutputSchema)
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
      }

      const clips = video.videoClips
        .map((clip) => ({
          id: clip.id,
          title: clip.title,
          description: clip.description ?? null,
          aspectRatio: clip.aspectRatio,
          startTime: clip.startTime,
          endTime: clip.endTime,
          videoUrl: clip.videoUrl,
          captions: clip.captions ?? null,
          hashtags: clip.hashtags ?? null,
        }))
        .sort((a, b) => a.startTime - b.startTime);

      const status = allowedVideoStatuses.includes(
        video.status as VideoStatus,
      )
        ? (video.status as VideoStatus)
        : "processing";

      return {
        video: {
          id: video.id,
          title: video.title,
          description: video.description ?? null,
          status,
          originalUrl: video.originalUrl,
          createdAt: video.createdAt,
        },
        clips,
        updatedAt: video.updatedAt,
        duration: Math.max(0, video.duration ?? 0),
      };
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
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
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete video",
          cause: error,
        });
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
        // Check if the video belongs to the user
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

        // Get job status from queue (can be null)
        const jobStatus = await getVideoJobStatus(videoId);

        // Map BullMQ states to our contract
        const mapState = (vStatus: string, jState?: string | null) => {
          // Final states prioritize video status in DB
          if (vStatus === "completed") return "completed" as const;
          if (vStatus === "failed") return "failed" as const;

          // No known job: consider queued by default
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

  getUserVideosForSelect: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.video.findMany({
      where: { userId: ctx.session.user.id, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, duration: true, createdAt: true },
    });
  }),
});
