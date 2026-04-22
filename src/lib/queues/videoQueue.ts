import { Queue } from "bullmq";
import { getBullConnection } from "@/lib/redis/connection";
import type { CaptionStyle, BrandingConfig } from "@/lib/video-processing";

export const VIDEO_QUEUE_NAME = "video-processing";
const VIDEO_JOB_NAME = "process-video";
const CLIP_JOB_NAME = "rerender-clip";

export type VideoProcessingJob = {
  videoId: string;
  userId: string;
  originalUrl: string;
  options: {
    generateClips: boolean;
    transcribe: boolean;
    generateHashtags: boolean;
    aspectRatios?: string[];
    captionStyle?: CaptionStyle;
    branding?: BrandingConfig;
    aiPromptOverride?: string | null;
    clipLengthMin?: number;
    clipLengthMax?: number;
    platform?: string;
    audience?: string;
    templateId?: string;
    replaceExistingClips?: boolean;
  };
};

/**
 * Single-clip re-render job. Used by the clip editor to regenerate one clip
 * in place (different trim, aspect ratio, captions, or template) without
 * re-running transcription/key-moment detection.
 */
export type ClipReRenderJob = {
  clipId: string;
  userId: string;
  videoId: string;
  startTime: number;
  endTime: number;
  aspectRatio: string;
  captions: string;
  captionStyle: CaptionStyle;
  branding?: BrandingConfig;
  templateId?: string | null;
};

export type AnyVideoQueueJob = VideoProcessingJob | ClipReRenderJob;

export type VideoJobResult = {
  success: boolean;
  videoId: string;
  clipsGenerated: number;
  duration?: number;
  error?: string;
};

let videoQueueInstance: Queue<AnyVideoQueueJob, VideoJobResult> | null = null;

/**
 * Lazily creates the shared video-processing queue. The queue carries both
 * full-video processing jobs and lightweight single-clip re-render jobs; they
 * are distinguished by BullMQ job name.
 */
export const getVideoQueue = (): Queue<AnyVideoQueueJob, VideoJobResult> => {
  if (!videoQueueInstance) {
    videoQueueInstance = new Queue<AnyVideoQueueJob, VideoJobResult>(
      VIDEO_QUEUE_NAME,
      {
        connection: getBullConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 10_000,
          },
          removeOnComplete: {
            age: 24 * 3600,
            count: 1000,
          },
          removeOnFail: {
            age: 7 * 24 * 3600,
          },
        },
      }
    ) as unknown as Queue<AnyVideoQueueJob, VideoJobResult>;
  }
  return videoQueueInstance;
};

/** Enqueues a full video-processing job, keyed by videoId for idempotency. */
export const enqueueVideoProcessing = async (
  job: VideoProcessingJob,
  priority?: number
) => {
  const queue = getVideoQueue();

  return queue.add(VIDEO_JOB_NAME, job, {
    jobId: `video-${job.videoId}`,
    priority: priority || 10,
    removeOnComplete: true,
  });
};

/**
 * Enqueues a single-clip re-render job. Uses a unique jobId per attempt so
 * consecutive saves in the editor can't collide with each other.
 */
export const enqueueClipReRender = async (
  job: ClipReRenderJob,
  priority?: number
) => {
  const queue = getVideoQueue();

  return queue.add(CLIP_JOB_NAME, job, {
    jobId: `clip-${job.clipId}-${Date.now()}`,
    priority: priority || 5,
    removeOnComplete: true,
  });
};

/** Returns true if a BullMQ job name belongs to the clip re-render shape. */
export const isClipReRenderJobName = (name: string): boolean =>
  name === CLIP_JOB_NAME;

/** Returns true if a BullMQ job name belongs to the full-video shape. */
export const isVideoProcessingJobName = (name: string): boolean =>
  name === VIDEO_JOB_NAME;

export const getVideoJobStatus = async (videoId: string) => {
  const queue = getVideoQueue();
  const jobId = `video-${videoId}`;
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    jobId: job.id,
    state,
    progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  };
};

export const cancelVideoProcessing = async (videoId: string) => {
  const queue = getVideoQueue();
  const jobId = `video-${videoId}`;
  const job = await queue.getJob(jobId);

  if (job) {
    await job.remove();
    return true;
  }

  return false;
};

export const getVideoQueueMetrics = async () => {
  const queue = getVideoQueue();

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
};

export const videoQueue = new Proxy(
  {} as Queue<AnyVideoQueueJob, VideoJobResult>,
  {
    get(_, prop) {
      return getVideoQueue()[
        prop as keyof Queue<AnyVideoQueueJob, VideoJobResult>
      ];
    },
  }
);
