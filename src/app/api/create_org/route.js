// api/auth/create_org/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../utils/dbConnect";
import Organization from "../../../models/Organization";
import { withRole } from "../../../utils/auth";

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const POST = withRole("Super Admin", async (request, _user) => {
  await dbConnect();

  const { name, orgType } = await request.json();

  if (!name || !orgType) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  const allowedOrgs = ["Vendor", "Campaign", "PAC", "Party", "Demo"];
  if (!allowedOrgs.includes(orgType)) {
    return NextResponse.json({ message: "Invalid org type" }, { status: 400 });
  }

  try {
    const existingOrg = await Organization.findOne({ name });
    if (existingOrg) {
      return NextResponse.json(
        { message: "Organization with that name already exists" },
        { status: 400 }
      );
    }

    const baseSlug = slugify(name) || "org";
    let slug = baseSlug;
    let counter = 2;

    // eslint-disable-next-line no-await-in-loop
    while (await Organization.exists({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const org = await Organization.create({
      name,
      slug,
      settings: {
        orgType,
      },
    });

    return NextResponse.json(
      {
        message: "Organization created successfully",
        org: {
          id: org._id.toString(),
          name: org.name,
          slug: org.slug,
          orgType: org.settings.orgType,
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
