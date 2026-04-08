import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const ORGS_QUERY_ALL = `
query OrgsListAll {
  organizations(order_by: { name: asc }) {
    id
    name
    slug
    org_type
    seat_limit
    plan
    subscription_status
  }
}
`;

const ORG_BY_ID = `
query OrgById($id: uuid!) {
  organizations_by_pk(id: $id) {
    id
    name
    slug
    org_type
    seat_limit
    plan
    subscription_status
  }
}
`;

export const GET = withUser(async (_request, user) => {
  try {
    const isSuperAdmin = user.role === "Super Admin";

    let orgs = [];

    if (isSuperAdmin) {
      const data = await hasuraFetch(ORGS_QUERY_ALL, {}, { admin: true });
      orgs = data.organizations || [];
    } else {
      const orgId = user.organization?.id;

      if (!orgId) {
        return NextResponse.json([], { status: 200 });
      }

      const data = await hasuraFetch(ORG_BY_ID, { id: orgId }, { admin: true });
      orgs = data.organizations_by_pk ? [data.organizations_by_pk] : [];
    }

    const normalized = orgs.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      orgType: org.org_type || null,
      seat_limit: org.seat_limit ?? null,
      plan: org.plan ?? null,
      subscription_status: org.subscription_status ?? null,
    }));

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error("GET /api/org error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
});
