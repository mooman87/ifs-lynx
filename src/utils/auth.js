// src/utils/auth.js
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { hasuraFetch } from "@/utils/hasura";

const ME_QUERY = `
query Me($id: uuid!) {
  users_by_pk(id: $id) {
    id
    email
    username
    full_name
    role
    organization {
      id
      name
      slug
      org_type
      timezone
    }
  }
}
`;

const roleRank = {
  "Canvasser": 1,
  "Field Director": 2,
  "Deputy State Director": 3,
  "State Director": 4,
  "Political Director": 5,
  "C Suite": 6,
  "HR": 6,
  "Payroll": 6,
  "Travel": 6,
  "Super Admin": 99,
  "Demo": 0,
};

export async function getAuthUser(request) {
  try {
    const token = request.cookies.get("operatorToken")?.value;
    if (!token) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    const data = await hasuraFetch(ME_QUERY, { id: payload.id }, { admin: true });
    const u = data.users_by_pk;
    if (!u) return null;

    return {
      id: u.id,
      email: u.email,
      username: u.username,
      fullName: u.full_name,
      role: u.role,
      organization: u.organization
        ? {
            id: u.organization.id,
            name: u.organization.name,
            slug: u.organization.slug,
            orgType: u.organization.org_type || null,
          }
        : null,
    };
  } catch (err) {
    console.error("getAuthUser error:", err);
    return null;
  }
}

export function withUser(handler) {
  return async function wrapped(request, ...rest) {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    return handler(request, user, ...rest);
  };
}

export function withRole(minRole, handler) {
  return withUser(async (request, user, ...rest) => {
    const userRank = roleRank[user.role] ?? 0;
    const minRank = roleRank[minRole] ?? Infinity;
    if (user.role !== "Super Admin" && userRank < minRank) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    return handler(request, user, ...rest);
  });
}

export function orgScope(user, baseFilter = {}, orgIdOverride) {
  // Keep for mongo until ready to delete
  if (user.role === "Super Admin") return orgIdOverride ? { ...baseFilter, organization: orgIdOverride } : baseFilter;
  return { ...baseFilter, organization: user.organization?.id || null };
}
