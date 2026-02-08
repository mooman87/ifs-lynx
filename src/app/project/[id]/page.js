// src/app/project/[id]/page.js
import { headers } from "next/headers";
import ProjectClient from "./ProjectClient";

function getBaseUrl(h) {
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host");

  if (host) return `${proto}://${host}`;

  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.URL) return process.env.URL; 
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL;

  return "http://localhost:3000";
}

export default async function ProjectPage({ params }) {
  const { id } = await params;

  const h = await headers();
  const cookieHeader = h.get("cookie") ?? "";

  const baseUrl = getBaseUrl();
  const url = new URL(`/api/project/${id}`, baseUrl);

  const res = await fetch(url, {
    method: "GET",
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to load project ${id}: ${res.status} ${text}`);
  }

  const data = await res.json();

  return <ProjectClient initialProject={data.project ?? data} />;
}
