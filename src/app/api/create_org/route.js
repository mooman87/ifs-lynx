// app/api/auth/create_org/route.js
import { NextResponse } from "next/server";
import { withRole } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


const CHECK_SLUG = `
query CheckOrgSlug($slug: String!) {
  organizations(where: { slug: { _eq: $slug } }, limit: 1) {
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
  }
}
`;

export const POST = withRole("Super Admin", async (request) => {
  try {
    const { name, orgType } = await request.json();

    if (!name || !orgType) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const allowedOrgs = ["Vendor", "Campaign", "PAC", "Party", "Demo"];
    if (!allowedOrgs.includes(orgType)) {
      return NextResponse.json(
        { message: "Invalid org type" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(name) || "org";
    let slug = baseSlug;
    let counter = 2;

    // eslint-disable-next-line no-await-in-loop
    while (true) {
      const exists = await hasuraFetch(
        CHECK_SLUG,
        { slug },
        { admin: true }
      );

      if (!exists.organizations.length) break;
      slug = `${baseSlug}-${counter++}`;
    }

  
    const result = await hasuraFetch(
      INSERT_ORG,
      {
        object: {
          name,
          slug,
          org_type: orgType,
        },
      },
      { admin: true }
    );

    const org = result.insert_organizations_one;

    return NextResponse.json(
      {
        message: "Organization created successfully",
        org: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          orgType: org.org_type,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create org error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});
