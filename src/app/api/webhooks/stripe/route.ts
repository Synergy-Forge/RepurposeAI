import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { EmailService } from "@/lib/email";
import { EmailType, EmailTemplateData } from "@/lib/email/types";
import { getEmailConfig } from "@/lib/email/config";

const emailService = new EmailService();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function upsertSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  let status: "free" | "starter" | "creator" | "producer" = "free";

  if (subscription.status === "active" && subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;

    switch (priceId) {
      case "prod_Sv9zE3Lt3Dza4U":
      case "prod_Szk7iWgJ9yfxrq":
        status = "starter";
        break;
      case "prod_SzjVo4rdm3LBx0":
      case "prod_Szk5YrAfOq7C0l":
        status = "creator";
        break;
      case "prod_Szjf5hO6PQoUja":
      case "prod_Szk4OGazQoSRbi":
        status = "producer";
        break;
      default:
        status = "free";
    }
  }

  const isCanceled =
    subscription.cancel_at_period_end && subscription.cancel_at;

  const endDate = isCanceled
    ? new Date((subscription.cancel_at as number) * 1000)
    : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: status,
      subscriptionEndDate: endDate,
    },
  });
}

async function removeSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "free",
      subscriptionEndDate: null,
    },
  });
}

async function handleCustomerEvent(event: Stripe.Event) {
  const customer = event.data.object as Stripe.Customer;

  switch (event.type) {
    case "customer.created":
    case "customer.updated":
    case "customer.deleted":
      console.log(`Customer event ${event.type}: ${customer.id}`);
      break;
  }
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(subscription);
      break;

    case "customer.subscription.deleted":
      await removeSubscription(subscription);
      break;

    case "customer.subscription.paused": {
      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { subscriptionStatus: "paused" },
        });
      }
      break;
    }

    case "customer.subscription.resumed":
      await upsertSubscription(subscription);
      break;
  }
}

async function handleInvoiceEvent(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  switch (event.type) {
    case "invoice.payment_succeeded": {
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (!customerId || !invoice.period_end) break;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionEndDate: new Date(invoice.period_end * 1000),
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const customerId =
        typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id;
      if (!customerId) break;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (user) {
        const planMap: Record<string, EmailTemplateData["user"]["plan"]> = {
          starter: "Starter",
          creator: "Creator",
          producer: "Producer",
        };
        const data: EmailTemplateData = {
          user: {
            name: user.name ?? "there",
            email: user.email ?? "",
            plan: planMap[user.subscriptionStatus] ?? "Free",
          },
          unsubscribeUrl: `${getEmailConfig().webappUrl}/unsubscribe`,
          supportUrl: `mailto:${getEmailConfig().supportEmail}`,
        };
        await emailService.sendEmail(EmailType.PAYMENT_FAILED, user.id, data);
      }
      break;
    }

    case "invoice.finalized":
    case "invoice.upcoming":
      console.log(`Invoice event ${event.type}: ${invoice.id}`);
      break;
  }
}

async function handlePaymentEvent(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  switch (event.type) {
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
      console.log(`Payment intent event ${event.type}: ${paymentIntent.id}`);
      break;
  }
}

async function handleCheckoutEvent(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.expired":
      console.log(`Checkout session event ${event.type}: ${session.id}`);
      break;
  }
}

async function handlePriceEvent(event: Stripe.Event) {
  const price = event.data.object as Stripe.Price;

  switch (event.type) {
    case "price.created":
    case "price.updated":
    case "price.deleted":
      console.log(`Price event ${event.type}: ${price.id}`);
      break;
  }
}

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    const signature = (await headers()).get("stripe-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: skip already-processed events
  const existing = await prisma.webhookEvent.findUnique({
    where: { id: event.id },
  });
  if (existing) {
    return NextResponse.json({ received: true });
  }

  try {
    if (event.type.startsWith("customer.")) {
      if (event.type.startsWith("customer.subscription.")) {
        await handleSubscriptionEvent(event);
      } else {
        await handleCustomerEvent(event);
      }
    } else if (event.type.startsWith("invoice.")) {
      await handleInvoiceEvent(event);
    } else if (event.type.startsWith("payment_intent.")) {
      await handlePaymentEvent(event);
    } else if (event.type.startsWith("checkout.session.")) {
      await handleCheckoutEvent(event);
    } else if (event.type.startsWith("price.")) {
      await handlePriceEvent(event);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }

    await prisma.webhookEvent.create({ data: { id: event.id } });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
