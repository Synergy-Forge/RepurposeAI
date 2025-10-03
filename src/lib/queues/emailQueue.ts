import { Queue } from "bullmq";

import { getBullConnection } from "@/lib/redis/connection";

export type EmailJob = {
  to: string;
  subject: string;
  template?: string;
  data?: Record<string, unknown>;
};

let emailQueueInstance: Queue<EmailJob> | null = null;

export const getEmailQueue = (): Queue<EmailJob> => {
  if (!emailQueueInstance) {
    emailQueueInstance = new Queue<EmailJob>("email", {
      connection: getBullConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
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

// For compatibility with existing code
export const emailQueue = new Proxy({} as Queue<EmailJob>, {
  get(target, prop) {
    return getEmailQueue()[prop as keyof Queue<EmailJob>];
  },
});
