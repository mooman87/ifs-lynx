import { NextResponse } from "next/server";
import Stripe from "stripe";
import { hasuraFetch } from "@/utils/hasura";

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

const UPDATE_ORG_BILLING = `
mutation UpdateOrgBilling(
  $stripeSubscriptionId: String!,
  $subscription_status: String!,
  $plan: String,
  $seat_limit: Int
) {
  update_organizations(
    where: { stripe_subscription_id: { _eq: $stripeSubscriptionId } }
    _set: {
      subscription_status: $subscription_status
      plan: $plan
      seat_limit: $seat_limit
    }
  ) {
    affected_rows
  }
}
`;

// 🔥 Map Stripe price IDs → your plans
function mapPriceToPlan(priceId) {
  switch (priceId) {
    case process.env.STRIPE_PRICE_CITIZEN:
      return { plan: "Citizen", seat_limit: 5 };
    case process.env.STRIPE_PRICE_COALITION:
      return { plan: "Coalition", seat_limit: 15 };
    case process.env.STRIPE_PRICE_COMMAND:
      return { plan: "Command Center", seat_limit: 50 };
    default:
      return { plan: null, seat_limit: null };
  }
}

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("❌ Stripe signature verification failed:", error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  try {
    console.log(`📡 Stripe event received: ${event.type} (${event.id})`);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const priceId = subscription.items?.data?.[0]?.price?.id || null;

        const { plan, seat_limit } = mapPriceToPlan(priceId);

        await hasuraFetch(
          UPDATE_ORG_BILLING,
          {
            stripeSubscriptionId: subscription.id,
            subscription_status: subscription.status,
            plan,
            seat_limit,
          },
          { admin: true },
        );

        console.log(
          `✅ Subscription sync: ${subscription.id} → ${subscription.status} (${plan})`,
        );

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        if (invoice.subscription) {
          await hasuraFetch(
            UPDATE_ORG_BILLING,
            {
              stripeSubscriptionId: invoice.subscription,
              subscription_status: "past_due",
              plan: null, // don't overwrite plan
              seat_limit: null,
            },
            { admin: true },
          );

          console.log(`⚠️ Payment failed: ${invoice.subscription}`);
        }

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;

        if (invoice.subscription) {
          await hasuraFetch(
            UPDATE_ORG_BILLING,
            {
              stripeSubscriptionId: invoice.subscription,
              subscription_status: "active",
              plan: null, // preserve existing plan
              seat_limit: null,
            },
            { admin: true },
          );

          console.log(`💰 Payment succeeded: ${invoice.subscription}`);
        }

        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`🔥 Webhook handler failed for event ${event?.id}:`, error);

    return new NextResponse(`Webhook Error: ${error.message}`, { status: 500 });
  }
}
