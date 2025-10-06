import { Queue } from "bullmq";
import { getBullConnection } from "@/lib/redis/connection";

export const VIDEO_QUEUE_NAME = "video-processing";
const VIDEO_JOB_NAME = "process-video";

export type VideoProcessingJob = {
  videoId: string;
  userId: string;
  originalUrl: string;
  options: {
    generateClips: boolean;
    transcribe: boolean;
    generateHashtags: boolean;
    aspectRatios?: string[]; // ['9:16', '16:9', '1:1']
  };
};

export type VideoJobResult = {
  success: boolean;
  videoId: string;
  clipsGenerated: number;
  duration?: number;
  error?: string;
};

let videoQueueInstance: Queue<VideoProcessingJob, VideoJobResult> | null = null;

export const getVideoQueue = (): Queue<VideoProcessingJob, VideoJobResult> => {
  if (!videoQueueInstance) {
    videoQueueInstance = new Queue<VideoProcessingJob, VideoJobResult>(
      VIDEO_QUEUE_NAME,
      {
        connection: getBullConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 10_000, // 10 segundos inicial
          },
          removeOnComplete: {
            age: 24 * 3600, // Manter jobs completos por 24 horas
            count: 1000, // Manter no máximo 1000 jobs completos
          },
          removeOnFail: {
            age: 7 * 24 * 3600, // Manter jobs falhados por 7 dias
          },
        },
      }
    );
  }
  return videoQueueInstance;
};

export const enqueueVideoProcessing = async (
  job: VideoProcessingJob,
  priority?: number
) => {
  const queue = getVideoQueue();

  return queue.add(VIDEO_JOB_NAME, job, {
    jobId: `video-${job.videoId}`, // Prevenir duplicatas
    priority: priority || 10, // Prioridade padrão
    // Remover job anterior se existir (idempotência)
    removeOnComplete: true,
  });
};

// Obter status de um job específico
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

// Cancelar processamento de vídeo
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

// Obter métricas da fila
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

// For compatibility
export const videoQueue = new Proxy(
  {} as Queue<VideoProcessingJob, VideoJobResult>,
  {
    get(_, prop) {
      return getVideoQueue()[
        prop as keyof Queue<VideoProcessingJob, VideoJobResult>
      ];
    },
  }
);
