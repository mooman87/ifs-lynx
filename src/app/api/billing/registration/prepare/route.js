import { NextResponse } from "next/server";
import Stripe from "stripe";
import { SignJWT } from "jose";
import { hasuraFetch } from "@/utils/hasura";

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

const PLAN_CONFIG = {
  Citizen: {
    priceId: process.env.STRIPE_PRICE_CITIZEN_TEST,
    seatLimit: 10,
    amountLabel: "$0.00/mo",
  },
  Coalition: {
    priceId: process.env.STRIPE_PRICE_COALITION_TEST,
    seatLimit: 20,
    amountLabel: "$99.99/mo",
  },
  "Command Center": {
    priceId: process.env.STRIPE_PRICE_COMMAND_CENTER_TEST,
    seatLimit: 100,
    amountLabel: "$199.99/mo",
  },
};

const CHECK_USER_EXISTS = `
query CheckUserExists($email: String!, $username: String!) {
  users(
    where: {
      _or: [
        { email: { _eq: $email } }
        { username: { _eq: $username } }
      ]
    }
    limit: 1
  ) {
    id
  }
}
`;

function required(value, label) {
  if (!value || !String(value).trim()) {
    throw new Error(`${label} is required`);
  }
}

async function signRegistrationToken(payload) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(secret);
}

export async function POST(request) {
  try {
    const body = await request.json();

    const plan = body.plan?.trim();
    const email = body.email?.trim().toLowerCase();
    const username = body.username?.trim();
    const fullName = body.fullName?.trim();
    const password = body.password;
    const organizationName = body.organizationName?.trim();
    const orgType = body.orgType?.trim();
    const role = body.role?.trim() || "C Suite";
    const acceptTerms = !!body.acceptTerms;
    const acceptPrivacy = !!body.acceptPrivacy;

    required(plan, "Plan");
    required(email, "Email");
    required(username, "Username");
    required(fullName, "Full name");
    required(password, "Password");
    required(organizationName, "Organization name");
    required(orgType, "Organization type");

    if (!acceptTerms || !acceptPrivacy) {
      return NextResponse.json(
        { message: "You must accept the Terms of Service and Privacy Policy." },
        { status: 400 },
      );
    }

    const config = PLAN_CONFIG[plan];
    if (!config || !config.priceId) {
      return NextResponse.json(
        { message: "Invalid or incomplete plan configuration." },
        { status: 400 },
      );
    }

    const existing = await hasuraFetch(
      CHECK_USER_EXISTS,
      { email, username },
      { admin: true },
    );

    if (existing.users?.length) {
      return NextResponse.json(
        { message: "A user with that email or username already exists." },
        { status: 400 },
      );
    }

    const customer = await stripe.customers.create({
      email,
      name: fullName,
      metadata: {
        plan,
        seat_limit: String(config.seatLimit),
        org_name: organizationName,
        org_type: orgType,
        username,
      },
    });

    let clientSecret = null;
    let billingMode = "subscription";
    let stripeSetupIntentId = null;
    let stripeSubscriptionId = null;

    if (plan === "Citizen") {
      billingMode = "setup";

      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ["card"],
        usage: "off_session",
        metadata: {
          plan,
          seat_limit: String(config.seatLimit),
          org_name: organizationName,
          org_type: orgType,
          email,
          username,
        },
      });

      clientSecret = setupIntent.client_secret;
      stripeSetupIntentId = setupIntent.id;

      if (!clientSecret) {
        throw new Error("Stripe did not return a setup client secret.");
      }
    } else {
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: config.priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        billing_mode: {
          type: "flexible",
        },
        expand: ["latest_invoice.confirmation_secret"],
        metadata: {
          plan,
          seat_limit: String(config.seatLimit),
          org_name: organizationName,
          org_type: orgType,
          email,
          username,
        },
      });

      const confirmationSecret =
        subscription.latest_invoice?.confirmation_secret;
      clientSecret = confirmationSecret?.client_secret;
      stripeSubscriptionId = subscription.id;

      if (!clientSecret) {
        console.error("Paid subscription did not return confirmation_secret:", {
          subscriptionId: subscription.id,
          latestInvoice: subscription.latest_invoice,
        });
        throw new Error("Stripe did not return a payment client secret.");
      }
    }

    const registrationToken = await signRegistrationToken({
      plan,
      seatLimit: config.seatLimit,
      email,
      username,
      fullName,
      password,
      organizationName,
      orgType,
      role,
      stripeCustomerId: customer.id,
      stripeSubscriptionId,
      stripeSetupIntentId,
      billingMode,
    });

    return NextResponse.json({
      clientSecret,
      registrationToken,
      plan,
      amountLabel: config.amountLabel,
      seatLimit: config.seatLimit,
      billingMode,
    });
  } catch (error) {
    console.error("Prepare registration error:", error);
    return NextResponse.json(
      { message: error.message || "Unable to prepare registration." },
      { status: 500 },
    );
  }
}
