'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc-client';
import { toast } from 'sonner';

export default function SubscriptionPage() {
  const { data: session } = useSession();

  const { data: subscriptionStatus } = trpc.user.getSubscriptionStatus.useQuery(undefined, {
    enabled: !!session?.user,
  });

  const createCheckoutSessionMutation = trpc.subscription.createCheckoutSession.useMutation();
  const createPortalSessionMutation = trpc.subscription.createPortalSession.useMutation();

  const handleSubscribe = async (priceId: string) => {
    try {
      const result = await createCheckoutSessionMutation.mutateAsync({
        priceId,
        successUrl: `${window.location.origin}/subscription?success=true`,
        cancelUrl: `${window.location.origin}/subscription?canceled=true`,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to create checkout session');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const result = await createPortalSessionMutation.mutateAsync({
        returnUrl: `${window.location.origin}/subscription`,
      });

      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast.error('Failed to open billing portal');
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'No card required',
      features: [
        '1 video per month',
        'Export in 720p',
        '15 min of video',
        'Watermark included',
        'Basic support',
      ],
      priceId: null,
      popular: false,
    },
    {
      name: 'Starter',
      price: '$9.99',
      period: '/month',
      features: [
        'Export videos in Full HD 1080p',
        '120 minutes of video',
        'Access to all features',
        'Standard support',
        'No watermark',
      ],
      priceId: 'price_starter_monthly', // Replace with actual Stripe price ID
      popular: false,
    },
    {
      name: 'Creator',
      price: '$24.99',
      period: '/month',
      features: [
        'Export videos in Full HD 1080p',
        '400 minutes of video',
        'Access to all features',
        'Subtitles support',
        'AI support for context',
        'Branding template',
        'Priority processing',
        '24/7 support',
        'Custom branding',
        'Analytics dashboard',
        'Team collaboration',
      ],
      priceId: 'price_pro_monthly', // Replace with actual Stripe price ID
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/">← Back to Dashboard</Link>
            </Button>
            <h1 className="text-2xl font-bold">Subscription Plans</h1>
          </div>

          {subscriptionStatus && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Current Plan:</span>
              <Badge variant="outline" className="capitalize">
                {subscriptionStatus.status}
              </Badge>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your video repurposing needs.
            All plans include our AI-powered processing technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <svg
                        className="h-4 w-4 text-green-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {plan.priceId ? (
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(plan.priceId!)}
                      disabled={createCheckoutSessionMutation.isPending}
                    >
                      {createCheckoutSessionMutation.isPending ? 'Loading...' : 'Subscribe'}
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current Subscription Info */}
        {subscriptionStatus && subscriptionStatus.status !== 'free' && (
          <Card className="mt-8 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Plan</span>
                <Badge className="capitalize">{subscriptionStatus.status}</Badge>
              </div>

              {subscriptionStatus.endDate && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next billing date</span>
                  <span className="text-muted-foreground">
                    {new Date(subscriptionStatus.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              <Button
                onClick={handleManageSubscription}
                disabled={createPortalSessionMutation.isPending}
                className="w-full"
              >
                {createPortalSessionMutation.isPending ? 'Loading...' : 'Manage Subscription'}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
