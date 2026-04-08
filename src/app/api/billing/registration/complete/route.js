import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { jwtVerify } from "jose";
import { hasuraFetch } from "@/utils/hasura";

const stripe = new Stripe(process.env.STRIPE_SECRET_TEST_KEY);

const CHECK_SLUG = `
query CheckSlug($slug: String!) {
  organizations(where: { slug: { _eq: $slug } }, limit: 1) {
    id
  }
}
`;

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

const INSERT_ORG = `
mutation InsertOrg($object: organizations_insert_input!) {
  insert_organizations_one(object: $object) {
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

const INSERT_USER = `
mutation InsertUser($object: users_insert_input!) {
  insert_users_one(object: $object) {
    id
    email
    username
    full_name
    role
    organization_id
  }
}
`;

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(name) {
  const base = slugify(name) || "org";
  let slug = base;
  let counter = 2;

  while (true) {
    const result = await hasuraFetch(CHECK_SLUG, { slug }, { admin: true });
    if (!result.organizations?.length) return slug;
    slug = `${base}-${counter++}`;
  }
}

export async function POST(request) {
  try {
    const { registrationToken } = await request.json();

    if (!registrationToken) {
      return NextResponse.json(
        { message: "Missing registration token." },
        { status: 400 },
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(registrationToken, secret);

    const email = payload.email;
    const username = payload.username;

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

    let subscriptionStatus = "active";
    let stripeSubscriptionId = payload.stripeSubscriptionId || null;

    if (payload.billingMode === "subscription") {
      if (!payload.stripeSubscriptionId) {
        return NextResponse.json(
          { message: "Missing Stripe subscription ID." },
          { status: 400 },
        );
      }

      const subscription = await stripe.subscriptions.retrieve(
        payload.stripeSubscriptionId,
        { expand: ["default_payment_method"] },
      );

      const allowedStatuses = ["active", "trialing", "incomplete"];
      if (!allowedStatuses.includes(subscription.status)) {
        return NextResponse.json(
          {
            message: `Subscription is not ready. Current status: ${subscription.status}`,
          },
          { status: 400 },
        );
      }

      subscriptionStatus = subscription.status;
    } else if (payload.billingMode === "setup") {
      if (!payload.stripeSetupIntentId) {
        return NextResponse.json(
          { message: "Missing Stripe setup intent ID." },
          { status: 400 },
        );
      }

      const setupIntent = await stripe.setupIntents.retrieve(
        payload.stripeSetupIntentId,
      );

      if (setupIntent.status !== "succeeded") {
        return NextResponse.json(
          {
            message: `Payment method setup not complete. Status: ${setupIntent.status}`,
          },
          { status: 400 },
        );
      }

      subscriptionStatus = "active";
      stripeSubscriptionId = null;
    } else {
      return NextResponse.json(
        { message: "Invalid billing mode." },
        { status: 400 },
      );
    }

    const slug = await uniqueSlug(payload.organizationName);

    const orgInsert = await hasuraFetch(
      INSERT_ORG,
      {
        object: {
          name: payload.organizationName,
          slug,
          org_type: payload.orgType,
          plan: payload.plan,
          seat_limit: payload.seatLimit,
          subscription_status: subscriptionStatus,
          stripe_customer_id: payload.stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        },
      },
      { admin: true },
    );

    const org = orgInsert.insert_organizations_one;

    const password_hash = await bcrypt.hash(payload.password, 10);

    const userInsert = await hasuraFetch(
      INSERT_USER,
      {
        object: {
          email: payload.email,
          username: payload.username,
          full_name: payload.fullName,
          password_hash,
          role: payload.role || "C Suite",
          organization_id: org.id,
        },
      },
      { admin: true },
    );

    const user = userInsert.insert_users_one;

    return NextResponse.json(
      {
        message: "Registration completed successfully.",
        plan: payload.plan,
        seatLimit: payload.seatLimit,
        organization: org,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Complete registration error:", error);
    return NextResponse.json(
      { message: error.message || "Unable to complete registration." },
      { status: 500 },
    );
  }
}
