// app/api/org/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Organization from "@/models/Organization";
import { withRole } from "@/utils/auth";

export const GET = withRole("Super Admin",  async () => {
  await dbConnect();

  const orgs = await Organization.find({})
    .sort({ name: 1 })
    .select("name slug settings.orgType")
    .lean();

  return NextResponse.json(
    orgs.map((org) => ({
      id: org._id.toString(),
      name: org.name,
      slug: org.slug,
      orgType: org.settings?.orgType || null,
    })),
    { status: 200 }
  );
});
