// src/utils/hasura.js
export async function hasuraFetch(query, variables = {}, { admin = false, token } = {}) {
  const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT;
  if (!endpoint) throw new Error("Missing HASURA_GRAPHQL_ENDPOINT");

  const headers = { "Content-Type": "application/json" };

  if (admin) {
    const secret = process.env.HASURA_ADMIN_SECRET;
    if (!secret) throw new Error("Missing HASURA_ADMIN_SECRET");
    headers["x-hasura-admin-secret"] = secret;
  } else if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    // No caching for auth calls
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    const msg = json.errors?.[0]?.message || `Hasura error (${res.status})`;
    throw new Error(msg);
  }
  return json.data;
}
