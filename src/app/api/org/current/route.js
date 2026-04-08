import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const SETTINGS_MANAGER_ROLES = new Set([
  "Super Admin",
  "C Suite",
  "Campaign Manager",
  "Deputy Campaign Manager",
  "Operations Director",
  "Finance Director",
  "Treasurer",
  "HR",
  "State Director",
  "Political Director",
]);

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

const UPDATE_ORG = `
mutation UpdateOrg($id: uuid!, $changes: organizations_set_input!) {
  update_organizations_by_pk(pk_columns: { id: $id }, _set: $changes) {
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

function normalizeOrg(org) {
  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    orgType: org.org_type || null,
    plan: org.plan || null,
    seat_limit: org.seat_limit ?? null,
    subscription_status: org.subscription_status || null,
    stripe_customer_id: org.stripe_customer_id || null,
    stripe_subscription_id: org.stripe_subscription_id || null,
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

    return NextResponse.json(
      { organization: normalizeOrg(org) },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/org/current error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});

export const PATCH = withUser(async (request, user) => {
  try {
    if (!SETTINGS_MANAGER_ROLES.has(user.role)) {
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

    const changes = {};
    if (typeof body.name === "string" && body.name.trim()) {
      changes.name = body.name.trim();
    }
    if (typeof body.orgType === "string" && body.orgType.trim()) {
      changes.org_type = body.orgType.trim();
    }

    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { message: "No valid changes provided." },
        { status: 400 },
      );
    }

    const updated = await hasuraFetch(
      UPDATE_ORG,
      { id: org.id, changes },
      { admin: true },
    );

    return NextResponse.json(
      {
        message: "Organization settings updated.",
        organization: normalizeOrg(updated.update_organizations_by_pk),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH /api/org/current error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
