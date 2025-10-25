import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Function to initialize Stripe only when needed
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function upsertSubscription(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find user by Stripe customer ID
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Determine subscription plan based on price/product
  let status: "free" | "starter" | "creator" | "producer" = "free";

  if (subscription.status === "active" && subscription.items.data.length > 0) {
    const priceId = subscription.items.data[0].price.id;

    // Map Stripe price IDs to subscription plans
    switch (priceId) {
      case "prod_Sv9zE3Lt3Dza4U": // Starter monthly
      case "prod_Szk7iWgJ9yfxrq": // Starter yearly
        status = "starter";
        break;
      case "prod_SzjVo4rdm3LBx0": // Creator monthly
      case "prod_Szk5YrAfOq7C0l": // Creator yearly
        status = "creator";
        break;
      case "prod_Szjf5hO6PQoUja": // Producer monthly
      case "prod_Szk4OGazQoSRbi": // Producer yearly
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
      console.log(`Customer created: ${customer.id}`);
      // Handle customer creation if needed
      break;

    case "customer.updated":
      console.log(`Customer updated: ${customer.id}`);
      // Handle customer updates if needed
      break;

    case "customer.deleted":
      console.log(`Customer deleted: ${customer.id}`);
      // Handle customer deletion - might need to clean up user data
      break;
  }
}

async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(subscription);
      break;

    case "customer.subscription.deleted":
      await removeSubscription(subscription);
      break;

    case "customer.subscription.paused":
      console.log(`Subscription paused: ${subscription.id}`);
      // Handle subscription pause
      break;

    case "customer.subscription.resumed":
      console.log(`Subscription resumed: ${subscription.id}`);
      // Handle subscription resume
      break;
  }
}

async function handleInvoiceEvent(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  switch (event.type) {
    case "invoice.payment_succeeded":
      console.log(`Invoice payment succeeded: ${invoice.id}`);
      // Handle successful payment
      break;

    case "invoice.payment_failed":
      console.log(`Invoice payment failed: ${invoice.id}`);
      // Handle failed payment - might need to notify user
      break;

    case "invoice.finalized":
      console.log(`Invoice finalized: ${invoice.id}`);
      // Handle invoice finalization
      break;

    case "invoice.upcoming":
      console.log(`Upcoming invoice: ${invoice.id}`);
      // Handle upcoming invoice notification
      break;
  }
}

async function handlePaymentEvent(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;

  switch (event.type) {
    case "payment_intent.succeeded":
      console.log(`Payment succeeded: ${paymentIntent.id}`);
      // Handle successful payment
      break;

    case "payment_intent.payment_failed":
      console.log(`Payment failed: ${paymentIntent.id}`);
      // Handle failed payment
      break;

    case "payment_intent.canceled":
      console.log(`Payment canceled: ${paymentIntent.id}`);
      // Handle canceled payment
      break;
  }
}

async function handleCheckoutEvent(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case "checkout.session.completed":
      console.log(`Checkout session completed: ${session.id}`);
      // Handle successful checkout completion
      break;

    case "checkout.session.expired":
      console.log(`Checkout session expired: ${session.id}`);
      // Handle expired checkout session
      break;
  }
}

async function handlePriceEvent(event: Stripe.Event) {
  const price = event.data.object as Stripe.Price;

  switch (event.type) {
    case "price.created":
      console.log(`Price created: ${price.id}`);
      // Handle new price creation
      break;

    case "price.updated":
      console.log(`Price updated: ${price.id}`);
      // Handle price updates
      break;

    case "price.deleted":
      console.log(`Price deleted: ${price.id}`);
      // Handle price deletion
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
    // Inicializa o Stripe apenas quando a rota é chamada
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

  try {
    // Route events to appropriate handlers
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler failed:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
