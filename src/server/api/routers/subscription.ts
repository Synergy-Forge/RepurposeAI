import { createTRPCRouter, protectedProcedure } from '@/lib/trpc';
import { z } from 'zod';
import Stripe from 'stripe';

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY não está configurada');
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

export const subscriptionRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripeClient();
      const userId = ctx.session.user.id;
      const { priceId, successUrl, cancelUrl } = input;

      // Get user from database
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email!,
          name: user.name!,
          metadata: {
            userId: userId,
          },
        });

        customerId = customer.id;

        // Update user with Stripe customer ID
        await ctx.prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId },
        });
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: userId,
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  createPortalSession: protectedProcedure
    .input(
      z.object({
        returnUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripeClient(); // Inicializa aqui
      const userId = ctx.session.user.id;
      const { returnUrl } = input;

      // Get user from database
      const user = await ctx.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user?.stripeCustomerId) {
        throw new Error('No subscription found');
      }

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      });

      return {
        url: session.url,
      };
    }),

  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const stripe = getStripeClient(); // Inicializa aqui
    const userId = ctx.session.user.id;

    // Get user from database
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user?.stripeCustomerId) {
      throw new Error('No subscription found');
    }

    // Get customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      throw new Error('No active subscription found');
    }

    // Cancel the subscription
    const subscription = await stripe.subscriptions.update(
      subscriptions.data[0].id,
      {
        cancel_at_period_end: true,
      }
    );

    // Update user subscription end date (status will be updated by webhook when subscription ends)
    await ctx.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionEndDate: subscription.cancel_at_period_end
          ? new Date((subscription.cancel_at as number) * 1000)
          : null,
      },
    });

    return {
      success: true,
      message:
        'Subscription will be cancelled at the end of the current period',
    };
  }),
});
