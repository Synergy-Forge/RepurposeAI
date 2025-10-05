import { Queue } from 'bullmq';

import { EmailType } from '@/lib/email/types';
import type { EmailOptions } from '@/lib/email/providers/zeptomail';
import { getBullConnection } from '@/lib/redis/connection';

export const EMAIL_QUEUE_NAME = 'email';
const EMAIL_JOB_NAME = 'send-email';

export type EmailJob = {
  userId: string;
  type: EmailType;
  options: EmailOptions;
};

let emailQueueInstance: Queue<EmailJob> | null = null;

export const getEmailQueue = (): Queue<EmailJob> => {
  if (!emailQueueInstance) {
    emailQueueInstance = new Queue<EmailJob>(EMAIL_QUEUE_NAME, {
      connection: getBullConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5_000,
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });
  }
  return emailQueueInstance;
};

export const enqueueEmail = async (job: EmailJob) => {
  return getEmailQueue().add(EMAIL_JOB_NAME, job);
};

// For compatibility with existing code
export const emailQueue = new Proxy({} as Queue<EmailJob>, {
  get(_, prop) {
    return getEmailQueue()[prop as keyof Queue<EmailJob>];
  },
});
