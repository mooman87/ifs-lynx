// src/app/project/[id]/page.js
import { headers } from "next/headers";
import ProjectClient from "./ProjectClient";

async function safeHeaders() {
  try {
    const h = await Promise.resolve(headers());
    if (h && typeof h.get === "function") return h;
    return null;
  } catch {
    return null;
  }
}

function getBaseUrl(h) {
  const host =
    (h && typeof h.get === "function" && (h.get("x-forwarded-host") || h.get("host"))) ||
    null;

  const proto =
    (h && typeof h.get === "function" && h.get("x-forwarded-proto")) ||
    "https";

  if (host) return `${proto}://${host}`;


  if (process.env.URL) return process.env.URL; 
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL; 
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;

 
  return "http://localhost:3000";
}

export default async function ProjectPage({ params }) {
  const { id } = await params;

  const h = await safeHeaders();
  const cookieHeader = h?.get?.("cookie") ?? "";

  const baseUrl = getBaseUrl(h);
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
