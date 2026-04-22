import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/lib/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { EmailService } from '@/lib/email';
import { EmailType } from '@/lib/email/types';
import { getEmailConfig } from '@/lib/email/config';

const emailService = new EmailService();

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { name, email } = input;

      const updatedUser = await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
        },
      });

      return updatedUser;
    }),

  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionEndDate: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return {
      status: user.subscriptionStatus,
      endDate: user.subscriptionEndDate,
      hasStripeCustomer: !!user.stripeCustomerId,
    };
  }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true, name: true, email: true, subscriptionStatus: true },
      });

      // Always return success to prevent email enumeration
      if (!user?.email) return { success: true };

      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate any outstanding reset links for this email so only the
      // newest link is usable.
      await ctx.prisma.verificationToken.deleteMany({
        where: { identifier: user.email },
      });

      await ctx.prisma.verificationToken.create({
        data: { identifier: user.email, token, expires },
      });

      const resetUrl = `${getEmailConfig().webappUrl}/reset-password?token=${token}`;
      const planMap: Record<string, 'Free' | 'Starter' | 'Creator' | 'Producer'> = {
        starter: 'Starter',
        creator: 'Creator',
        producer: 'Producer',
      };

      await emailService.sendEmail(EmailType.PASSWORD_RESET, user.id, {
        user: {
          name: user.name ?? 'there',
          email: user.email,
          plan: planMap[user.subscriptionStatus] ?? 'Free',
        },
        resetUrl,
        unsubscribeUrl: `${getEmailConfig().webappUrl}/unsubscribe`,
        supportUrl: `mailto:${getEmailConfig().supportEmail}`,
      });

      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        password: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const record = await ctx.prisma.verificationToken.findUnique({
        where: { token: input.token },
      });

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid or expired reset token' });
      }

      if (record.expires < new Date()) {
        await ctx.prisma.verificationToken.delete({ where: { token: input.token } });
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Reset token has expired' });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      await ctx.prisma.user.update({
        where: { email: record.identifier },
        data: { password: hashedPassword },
      });

      await ctx.prisma.verificationToken.delete({ where: { token: input.token } });

      return { success: true };
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true },
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      if (!user.password) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No password set on this account',
        });
      }

      const matches = await bcrypt.compare(input.currentPassword, user.password);
      if (!matches) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Current password is incorrect',
        });
      }

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      return { success: true };
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (user?.stripeCustomerId) {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        limit: 10,
      });
      await Promise.all(
        subscriptions.data.map((sub) => stripe.subscriptions.cancel(sub.id))
      );
    }

    await ctx.prisma.user.delete({ where: { id: userId } });

    return { success: true };
  }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [videoCount, clipCount, recentVideos, user, statusGroups] = await Promise.all([
      ctx.prisma.video.count({ where: { userId, status: 'completed' } }),
      ctx.prisma.videoClip.count({ where: { video: { userId } } }),
      ctx.prisma.video.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          _count: { select: { videoClips: true } },
        },
      }),
      ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { videosProcessed: true, videoQuotaLimit: true },
      }),
      ctx.prisma.video.groupBy({
        by: ['status'],
        where: { userId },
        _count: { status: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const group of statusGroups) {
      statusCounts[group.status] = group._count.status;
    }

    return {
      videosProcessed: videoCount,
      clipsGenerated: clipCount,
      quotaUsed: user?.videosProcessed ?? 0,
      quotaLimit: user?.videoQuotaLimit ?? 5,
      recentActivity: recentVideos.map((v) => ({
        id: v.id,
        title: v.title,
        status: v.status,
        updatedAt: v.updatedAt,
        clipCount: v._count.videoClips,
      })),
      statusCounts: {
        completed: statusCounts['completed'] ?? 0,
        processing: (statusCounts['processing'] ?? 0) + (statusCounts['uploading'] ?? 0),
        failed: statusCounts['failed'] ?? 0,
      },
    };
  }),
});
