import { NextResponse } from "next/server";
import Stripe from "stripe";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

const ORG_BY_ID = `
query OrgById($id: uuid!) {
  organizations_by_pk(id: $id) {
    id
    name
    slug
    org_type
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
    org_type
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

async function resolvePaymentMethod(customerId, subscriptionId) {
  let paymentMethod = null;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method"],
    });

    const maybePm = subscription.default_payment_method;
    if (maybePm && typeof maybePm === "object") {
      paymentMethod = maybePm;
    } else if (typeof maybePm === "string") {
      paymentMethod = await stripe.paymentMethods.retrieve(maybePm);
    }

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end || null,
      },
      paymentMethod,
    };
  }

  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      const maybePm = customer.invoice_settings?.default_payment_method;
      if (maybePm && typeof maybePm === "string") {
        paymentMethod = await stripe.paymentMethods.retrieve(maybePm);
      } else if (maybePm && typeof maybePm === "object") {
        paymentMethod = maybePm;
      }
    }
  }

  return {
    subscription: null,
    paymentMethod,
  };
}

export const GET = withUser(async (request, user) => {
  try {
    const org = await resolveOrg(request, user);

    if (!org) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 },
      );
    }

    const countRes = await hasuraFetch(
      COUNT_USERS_BY_ORG,
      { orgId: org.id },
      { admin: true },
    );

    const seatsUsed = countRes.users_aggregate?.aggregate?.count || 0;

    let invoices = [];
    let paymentMethodSummary = null;
    let subscriptionSummary = null;

    if (org.stripe_customer_id || org.stripe_subscription_id) {
      const { paymentMethod, subscription } = await resolvePaymentMethod(
        org.stripe_customer_id,
        org.stripe_subscription_id,
      );

      subscriptionSummary = subscription;

      if (paymentMethod?.card) {
        paymentMethodSummary = {
          brand: paymentMethod.card.brand,
          last4: paymentMethod.card.last4,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year,
        };
      }

      if (org.stripe_customer_id) {
        const invoiceList = await stripe.invoices.list({
          customer: org.stripe_customer_id,
          limit: 10,
        });

        invoices = (invoiceList.data || []).map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          total: invoice.total,
          currency: invoice.currency,
          created: invoice.created,
          hosted_invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
        }));
      }
    }

    return NextResponse.json(
      {
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          orgType: org.org_type || null,
          plan: org.plan || null,
          seat_limit: org.seat_limit ?? null,
          subscription_status: org.subscription_status || null,
        },
        billing: {
          seatsUsed,
          seatsRemaining:
            typeof org.seat_limit === "number"
              ? Math.max(org.seat_limit - seatsUsed, 0)
              : null,
          subscription: subscriptionSummary,
          paymentMethod: paymentMethodSummary,
          invoices,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/billing/current error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
