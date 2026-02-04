// api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { hasuraFetch } from "@/utils/hasura";

const LOGIN_QUERY = `
query LoginByUsername($username: String!) {
  users(where: {username: {_eq: $username}}, limit: 1) {
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

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ message: "Missing username or password" }, { status: 400 });
    }


    const data = await hasuraFetch(LOGIN_QUERY, { username }, { admin: true });
    const user = data.users?.[0];

    if (!user) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error("Missing JWT_SECRET");

    // Hasura JWT claims
    const hasuraClaims = {
      "x-hasura-default-role": user.role,
      "x-hasura-allowed-roles": [user.role, "Super Admin"].includes(user.role)
        ? ["Super Admin", user.role]
        : [user.role],
      "x-hasura-user-id": user.id,
      "x-hasura-organization-id": user.organization?.id || null,
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
          }
        : null,
   
      "https://hasura.io/jwt/claims": hasuraClaims,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(new TextEncoder().encode(jwtSecret));

    const response = NextResponse.json(
      { message: "Login successful", token, user: payload },
      { status: 200 }
    );

    response.cookies.set("operatorToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}
