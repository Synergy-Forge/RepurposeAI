import { z } from "zod";

export const jobPayloadSchema = z.object({
  to: z.string().min(1, "Campo 'to' é obrigatório"),
  subject: z.string().min(1, "Campo 'subject' é obrigatório"),
  template: z.string().optional(),
  data: z.record(z.unknown()).optional(),
});

export type JobPayload = z.infer<typeof jobPayloadSchema>;

export function assertJobPayload(payload: unknown): JobPayload {
  return jobPayloadSchema.parse(payload);
}

export function makeJobData(
  index: number,
  shouldSimulateFailure: boolean
): JobPayload {
  return {
    to: `user${index}@example.com`,
    subject: `RepurposeAI Test #${index}`,
    template: "notification",
    data: {
      jobIndex: index,
      simulateFailure: shouldSimulateFailure,
    },
  };
}
