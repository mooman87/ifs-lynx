import { redirect } from "next/navigation";

export default async function OrgPage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    redirect("/dashboard?selectedPage=Admin%20Dashboard");
  }

  redirect(
    `/dashboard?selectedPage=${encodeURIComponent("Active Projects")}&orgSlug=${encodeURIComponent(slug)}`,
  );
}
