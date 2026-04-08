// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { hasuraFetch } from "@/utils/hasura";

const LOGIN_QUERY = `
query LoginByIdentifier($identifier: String!, $email: String!) {
  users(
    where: {
      _or: [
        { username: { _eq: $identifier } }
        { email: { _eq: $email } }
      ]
    }
    limit: 1
  ) {
    id
    email
    username
    full_name
    role
    password_hash
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

function buildAllowedRoles(role) {
  if (!role) return ["anonymous"];
  if (role === "Super Admin") return ["Super Admin"];
  return [role];
}

export async function POST(request) {
  try {
    const body = await request.json();

    const identifier = body.identifier?.trim();
    const password = body.password;
    const email = identifier?.toLowerCase() || "";

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Missing login identifier or password" },
        { status: 400 },
      );
    }

    const data = await hasuraFetch(
      LOGIN_QUERY,
      { identifier, email },
      { admin: true },
    );

    const user = data.users?.[0];

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 400 },
      );
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 400 },
      );
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("Missing JWT_SECRET");
    }

    const hasuraClaims = {
      "x-hasura-default-role": user.role,
      "x-hasura-allowed-roles": buildAllowedRoles(user.role),
      "x-hasura-user-id": user.id,
      "x-hasura-organization-id": user.organization?.id || "",
    };

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            slug: user.organization.slug,
            orgType: user.organization.org_type || null,
            timezone: user.organization.timezone || null,
          }
        : null,
      "https://hasura.io/jwt/claims": hasuraClaims,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(jwtSecret));

    const response = NextResponse.json(
      {
        message: "Login successful",
        token,
        user: payload,
      },
      { status: 200 },
    );

    response.cookies.set("operatorToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 },
    );
  }
}
