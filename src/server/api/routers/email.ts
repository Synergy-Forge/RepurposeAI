import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc';
import { EmailService } from '@/lib/email';
import { EmailType } from '@/lib/email/types';

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
    .mutation(async ({ ctx: _ctx, input }) => {
      // This would update the database
      console.log('Updating email preferences:', input);
      return { success: true };
    }),

  getEmailHistory: protectedProcedure.query(async ({ ctx: _ctx }) => {
    // This would query the database for email history
    return [];
  }),

  resendEmail: protectedProcedure
    .input(z.object({ emailLogId: z.string() }))
    .mutation(async ({ ctx: _ctx, input }) => {
      // This would resend an email from the log
      console.log('Resending email:', input.emailLogId);
      return { success: true };
    }),

  unsubscribe: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx: _ctx, input }) => {
      // This would handle unsubscribe requests
      console.log('Unsubscribe request:', input.token);
      return { success: true };
    }),

  previewTemplate: protectedProcedure
    .input(templatePreviewSchema)
    .query(async ({ ctx: _ctx, input }) => {
      // This would generate a preview of the email template
      const emailService = new EmailService();
      const data = {
        user: {
          name: 'Preview User',
          email: 'preview@example.com',
          plan: 'Free' as const,
        },
        unsubscribeUrl: 'https://re-purpose.studio/unsubscribe',
        supportUrl: 'mailto:support@re-purpose.studio',
      };

      const content = await emailService['generateEmailContent'](input.type, data);
      return content;
    }),

  testEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const emailService = new EmailService();
      const data = {
        user: {
          name: 'Test User',
          email: input.email,
          plan: 'Free' as const,
        },
        unsubscribeUrl: 'https://re-purpose.studio/unsubscribe',
        supportUrl: 'mailto:support@re-purpose.studio',
      };

      const success = await emailService.sendEmail(EmailType.WELCOME, ctx.session.user.id, data);
      return { success };
    }),
});
