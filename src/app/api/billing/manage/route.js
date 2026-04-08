import { NextResponse } from "next/server";
import Stripe from "stripe";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

const BILLING_MANAGER_ROLES = new Set([
  "Super Admin",
  "C Suite",
  "Campaign Manager",
  "Deputy Campaign Manager",
  "Finance Director",
  "Treasurer",
  "Operations Director",
]);

const ORG_BY_ID = `
query OrgById($id: uuid!) {
  organizations_by_pk(id: $id) {
    id
    name
    slug
    plan
    seat_limit
    subscription_status
    stripe_customer_id
    stripe_subscription_id
  }
}
`;

const ORG_BY_SLUG = `
query OrgBySlug($slug: String!) {
  organizations(where: { slug: { _eq: $slug } }, limit: 1) {
    id
    name
    slug
    plan
    seat_limit
    subscription_status
    stripe_customer_id
    stripe_subscription_id
  }
}
`;

const COUNT_USERS_BY_ORG = `
query CountUsersByOrg($orgId: uuid!) {
  users_aggregate(where: { organization_id: { _eq: $orgId } }) {
    aggregate {
      count
    }
  }
}
`;

const UPDATE_ORG_BILLING = `
mutation UpdateOrgBilling($id: uuid!, $changes: organizations_set_input!) {
  update_organizations_by_pk(pk_columns: { id: $id }, _set: $changes) {
    id
    plan
    seat_limit
    subscription_status
    stripe_subscription_id
    stripe_customer_id
  }
}
`;

async function resolveOrg(request, user) {
  const { searchParams } = new URL(request.url);
  const orgSlug = searchParams.get("orgSlug");

  if (user.role === "Super Admin" && orgSlug) {
    const data = await hasuraFetch(
      ORG_BY_SLUG,
      { slug: orgSlug },
      { admin: true },
    );
    return data.organizations?.[0] || null;
  }

  const orgId = user.organization?.id;
  if (!orgId) return null;

  const data = await hasuraFetch(ORG_BY_ID, { id: orgId }, { admin: true });
  return data.organizations_by_pk || null;
}

async function getSeatsUsed(orgId) {
  const countRes = await hasuraFetch(
    COUNT_USERS_BY_ORG,
    { orgId },
    { admin: true },
  );

  return countRes.users_aggregate?.aggregate?.count || 0;
}

function getPlanConfig(plan) {
  switch (plan) {
    case "Citizen":
      return {
        priceId: process.env.STRIPE_PRICE_CITIZEN_TEST,
        seatLimit: 5,
      };
    case "Coalition":
      return {
        priceId: process.env.STRIPE_PRICE_COALITION_TEST,
        seatLimit: 15,
      };
    case "Command Center":
      return {
        priceId: process.env.STRIPE_PRICE_COMMAND_CENTER_TEST,
        seatLimit: 50,
      };
    default:
      return null;
  }
}

export const POST = withUser(async (request, user) => {
  try {
    if (!BILLING_MANAGER_ROLES.has(user.role)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const org = await resolveOrg(request, user);
    if (!org) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const action = body.action;

    if (!action) {
      return NextResponse.json({ message: "Missing action." }, { status: 400 });
    }

    if (action === "change_plan") {
      const nextPlan = body.plan;
      const config = getPlanConfig(nextPlan);

      if (!config) {
        return NextResponse.json({ message: "Invalid plan." }, { status: 400 });
      }

      if (nextPlan === org.plan) {
        return NextResponse.json(
          { message: "Organization is already on that plan." },
          { status: 200 },
        );
      }

      const seatsUsed = await getSeatsUsed(org.id);

      if (seatsUsed > config.seatLimit) {
        return NextResponse.json(
          {
            message: `This organization currently has ${seatsUsed} active users and cannot move to ${nextPlan} (${config.seatLimit} seats). Reduce active login-enabled users first.`,
          },
          { status: 409 },
        );
      }

      // Paid -> Citizen downgrade
      if (nextPlan === "Citizen") {
        if (org.stripe_subscription_id) {
          await stripe.subscriptions.cancel(org.stripe_subscription_id);
        }

        await hasuraFetch(
          UPDATE_ORG_BILLING,
          {
            id: org.id,
            changes: {
              plan: "Citizen",
              seat_limit: 5,
              subscription_status: "active",
              stripe_subscription_id: null,
            },
          },
          { admin: true },
        );

        return NextResponse.json(
          {
            message: "Plan updated to Citizen.",
            organization: {
              id: org.id,
              plan: "Citizen",
              seat_limit: 5,
              subscription_status: "active",
              seats_used: seatsUsed,
            },
          },
          { status: 200 },
        );
      }

      // Citizen -> paid is not wired yet because it needs a payment confirmation flow
      if (!org.stripe_subscription_id) {
        return NextResponse.json(
          {
            message:
              "Upgrading from Citizen to a paid plan from this page is the next step. It requires a payment confirmation flow.",
          },
          { status: 400 },
        );
      }

      const subscription = await stripe.subscriptions.retrieve(
        org.stripe_subscription_id,
      );

      const itemId = subscription.items?.data?.[0]?.id;
      if (!itemId) {
        return NextResponse.json(
          { message: "Subscription item not found." },
          { status: 400 },
        );
      }

      const updated = await stripe.subscriptions.update(
        org.stripe_subscription_id,
        {
          items: [
            {
              id: itemId,
              price: config.priceId,
            },
          ],
          proration_behavior: "create_prorations",
        },
      );

      await hasuraFetch(
        UPDATE_ORG_BILLING,
        {
          id: org.id,
          changes: {
            plan: nextPlan,
            seat_limit: config.seatLimit,
            subscription_status: updated.status,
          },
        },
        { admin: true },
      );

      return NextResponse.json(
        {
          message: `Plan updated to ${nextPlan}.`,
          subscription: {
            id: updated.id,
            status: updated.status,
            cancel_at_period_end: updated.cancel_at_period_end,
          },
          organization: {
            id: org.id,
            plan: nextPlan,
            seat_limit: config.seatLimit,
            seats_used: seatsUsed,
          },
        },
        { status: 200 },
      );
    }

    if (action === "cancel") {
      if (!org.stripe_subscription_id) {
        return NextResponse.json(
          { message: "No paid subscription found." },
          { status: 400 },
        );
      }

      const updated = await stripe.subscriptions.update(
        org.stripe_subscription_id,
        {
          cancel_at_period_end: true,
        },
      );

      return NextResponse.json(
        {
          message: "Subscription will cancel at period end.",
          subscription: {
            id: updated.id,
            status: updated.status,
            cancel_at_period_end: updated.cancel_at_period_end,
            current_period_end: updated.current_period_end || null,
          },
        },
        { status: 200 },
      );
    }

    if (action === "reactivate") {
      if (!org.stripe_subscription_id) {
        return NextResponse.json(
          { message: "No paid subscription found." },
          { status: 400 },
        );
      }

      const updated = await stripe.subscriptions.update(
        org.stripe_subscription_id,
        {
          cancel_at_period_end: false,
        },
      );

      return NextResponse.json(
        {
          message: "Subscription reactivated.",
          subscription: {
            id: updated.id,
            status: updated.status,
            cancel_at_period_end: updated.cancel_at_period_end,
            current_period_end: updated.current_period_end || null,
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { message: "Unsupported action." },
      { status: 400 },
    );
  } catch (error) {
    console.error("POST /api/billing/manage error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
