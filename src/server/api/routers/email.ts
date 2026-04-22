import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/lib/trpc";
import { enqueueEmail } from "@/lib/queues/emailQueue";
import { EmailService } from "@/lib/email";
import { EmailType, EmailTemplateData } from "@/lib/email/types";
import { getEmailConfig } from "@/lib/email/config";
import type { EmailOptions } from "@/lib/email/providers/zeptomail";
import { ensureUnsubscribeToken } from "@/lib/email/unsubscribe";

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

/**
 * Types whose template needs only `user + unsubscribeUrl + supportUrl` from
 * the current DB state. These can be safely resent without requiring the
 * original template payload to be persisted.
 */
const RESENDABLE_SELF_CONTAINED_TYPES: ReadonlySet<string> = new Set([
  EmailType.WELCOME,
  EmailType.FEATURE_ANNOUNCEMENT,
  EmailType.REACTIVATION,
  EmailType.LOGIN_ALERT,
  EmailType.QUOTA_WARNING,
  EmailType.QUOTA_EXCEEDED,
  EmailType.DOWNGRADE_TO_FREE,
  EmailType.WEEKLY_DIGEST,
]);

export const emailRouter = createTRPCRouter({
  getUserPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // Ensure an unsubscribe token exists for this user so any future email
    // send (or unsubscribe click) has a valid token to work with.
    await ensureUnsubscribeToken(userId);
    const pref = await ctx.prisma.emailPreference.findUnique({
      where: { userId },
    });
    return {
      marketingEmails: pref?.marketingEmails ?? true,
      processingUpdates: pref?.processingUpdates ?? true,
      weeklyDigest: pref?.weeklyDigest ?? true,
      featureAnnouncements: pref?.featureAnnouncements ?? true,
      unsubscribed: Boolean(pref?.unsubscribedAt),
    };
  }),

  updatePreferences: protectedProcedure
    .input(emailPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      await ensureUnsubscribeToken(userId);
      await ctx.prisma.emailPreference.update({
        where: { userId },
        data: {
          ...input,
          // Any explicit update re-opts-in (clears unsubscribedAt)
          unsubscribedAt: null,
        },
      });
      return { success: true };
    }),

  getEmailHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.emailLog.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { sentAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        subject: true,
        sentAt: true,
        deliveredAt: true,
        openedAt: true,
      },
    });
  }),

  /**
   * Re-sends a previously logged email. Only supports types whose rendered
   * content depends purely on the recipient's current profile (no video or
   * subscription-specific payload needed). Enqueues a fresh email with a new
   * EmailLog entry rather than mutating the original.
   */
  resendEmail: protectedProcedure
    .input(z.object({ emailLogId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const log = await ctx.prisma.emailLog.findUnique({
        where: { id: input.emailLogId },
      });

      if (!log || log.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email not found in your history",
        });
      }

      if (!RESENDABLE_SELF_CONTAINED_TYPES.has(log.type)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This email type cannot be resent. It was tied to a specific event (video processing or subscription change) and the original context is no longer available.",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, subscriptionStatus: true },
      });

      if (!user?.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot resend email: no email address on file",
        });
      }

      const planMap: Record<string, EmailTemplateData["user"]["plan"]> = {
        starter: "Starter",
        creator: "Creator",
        producer: "Producer",
      };

      const emailService = new EmailService();
      const data: EmailTemplateData = {
        user: {
          name: user.name ?? "there",
          email: user.email,
          plan: planMap[user.subscriptionStatus] ?? "Free",
        },
        unsubscribeUrl: `${getEmailConfig().webappUrl}/unsubscribe`,
        supportUrl: `mailto:${getEmailConfig().supportEmail}`,
      };

      const success = await emailService.sendEmail(
        log.type as EmailType,
        userId,
        data
      );

      if (!success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to queue email for resend",
        });
      }

      return { success: true };
    }),

  /**
   * Processes an unsubscribe click from an emailed link. Matches the token
   * against EmailPreference.unsubscribeToken, flips all preference booleans
   * off, and records the unsubscribe timestamp. Returns the masked recipient
   * email so the public page can show a helpful confirmation.
   */
  unsubscribe: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const preference = await ctx.prisma.emailPreference.findUnique({
        where: { unsubscribeToken: input.token },
        include: {
          user: { select: { email: true } },
        },
      });

      if (!preference) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This unsubscribe link is invalid or has expired.",
        });
      }

      await ctx.prisma.emailPreference.update({
        where: { id: preference.id },
        data: {
          marketingEmails: false,
          processingUpdates: false,
          weeklyDigest: false,
          featureAnnouncements: false,
          unsubscribedAt: new Date(),
        },
      });

      return {
        success: true,
        email: preference.user?.email ?? null,
      };
    }),

  previewTemplate: protectedProcedure
    .input(templatePreviewSchema)
    .query(async ({ ctx: _ctx, input }) => {
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
