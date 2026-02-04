// app/api/org/route.js
import { NextResponse } from "next/server";
import { withRole } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const ORGS_QUERY = `
query OrgsList {
  organizations(order_by: { name: asc }) {
    id
    name
    slug
    org_type
  }
}
`;

export const GET = withRole("Super Admin", async () => {
  try {
    const data = await hasuraFetch(ORGS_QUERY, {}, { admin: true });

    const orgs = (data.organizations || []).map((org) => ({
      id: org.id,                
      name: org.name,
      slug: org.slug,
      orgType: org.org_type || null,
    }));

    return NextResponse.json(orgs, { status: 200 });
  } catch (error) {
    console.error("GET /api/org error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});
