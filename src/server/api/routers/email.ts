import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc";
import { enqueueEmail } from "@/lib/queues/emailQueue";
import { EmailService } from "@/lib/email";
import { EmailType } from "@/lib/email/types";
import { getEmailConfig } from "@/lib/email/config";
import type { EmailOptions } from "@/lib/email/providers/zeptomail";

const emailPreferencesSchema = z.object({
  marketingEmails: z.boolean(),
  processingUpdates: z.boolean(),
  weeklyDigest: z.boolean(),
  featureAnnouncements: z.boolean(),
});

const templatePreviewSchema = z.object({
  type: z.nativeEnum(EmailType),
  userId: z.string(),
});

export const emailRouter = createTRPCRouter({
  getUserPreferences: protectedProcedure.query(async ({ ctx: _ctx }) => {
    // This would query the database for user preferences
    // For now, return default preferences
    return {
      marketingEmails: true,
      processingUpdates: true,
      weeklyDigest: true,
      featureAnnouncements: true,
    };
  }),

  updatePreferences: protectedProcedure
    .input(emailPreferencesSchema)
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      // This would update the database
      return { success: true };
    }),

  getEmailHistory: protectedProcedure.query(async ({ ctx: _ctx }) => {
    // This would query the database for email history
    return [];
  }),

  resendEmail: protectedProcedure
    .input(z.object({ emailLogId: z.string() }))
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      // This would resend an email from the log
      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx: _ctx, input: _input }) => {
      // This would handle unsubscribe requests
      return { success: true };
    }),

  previewTemplate: protectedProcedure
    .input(templatePreviewSchema)
    .query(async ({ ctx: _ctx, input }) => {
      // This would generate a preview of the email template
      const emailService = new EmailService();
      const data = {
        user: {
          name: "Preview User",
          email: "preview@example.com",
          plan: "Free" as const,
        },
        unsubscribeUrl: "https://re-purpose.studio/unsubscribe",
        supportUrl: "mailto:support@re-purpose.studio",
      };

      const content = await emailService["generateEmailContent"](
        input.type,
        data
      );
      return content;
    }),

  testEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const emailService = new EmailService();
      const data = {
        user: {
          name: "Test User",
          email: input.email,
          plan: "Free" as const,
        },
        unsubscribeUrl: "https://re-purpose.studio/unsubscribe",
        supportUrl: "mailto:support@re-purpose.studio",
      };

      const success = await emailService.sendEmail(
        EmailType.WELCOME,
        ctx.session.user.id,
        data
      );
      return { success };
    }),

  enqueueEmail: protectedProcedure
    .input(
      z.object({
        to: z.string().email(),
        subject: z.string().min(1),
        html: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const config = getEmailConfig();

      const options: EmailOptions = {
        to: input.to,
        subject: input.subject,
        html:
          input.html ??
          `<p>${input.subject}</p><p>Sent via Repurpose AI testing endpoint.</p>`,
        from: `${config.fromName} <${config.fromEmail}>`,
      };

      const job = await enqueueEmail({
        userId: ctx.session.user.id,
        type: EmailType.FEATURE_ANNOUNCEMENT,
        options,
      });

      return { jobId: job.id };
    }),
});
