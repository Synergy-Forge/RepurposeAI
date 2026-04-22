import { createTRPCRouter, protectedProcedure } from '@/lib/trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

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

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [videoCount, clipCount, recentVideos, user] = await Promise.all([
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
    ]);

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
    };
  }),
});
