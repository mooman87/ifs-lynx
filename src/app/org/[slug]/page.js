// app/org/[slug]/page.js
import dbConnect from "@/utils/dbConnect";
import Organization from "@/models/Organization";

export default async function OrgPage({ params }) {
  const { slug } = params;

  await dbConnect();
  const org = await Organization.findOne({ slug }).lean();

  if (!org) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Organization not found</h1>
        <p className="mt-2 text-gray-600">Slug: {slug}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{org.name}</h1>
      <p className="mt-2 text-gray-600">
        Type: {org.settings?.orgType || "N/A"}
      </p>
      <p className="mt-1 text-gray-500">Slug: {org.slug}</p>

      {/* Later: render org-specific dashboard, projects, travel, etc */}
    </div>
  );
}
