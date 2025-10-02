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
        removeOnComplete: true,
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
