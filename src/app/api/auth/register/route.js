// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withRole } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const allowedRoles = [
  "Canvasser",
  "Field Director",
  "Deputy State Director",
  "State Director",
  "Political Director",
  "C Suite",
  "HR",
  "Payroll",
  "Travel",
  "Super Admin",
  "Demo",
];

// Simple UUID v4-ish check (good enough for validation)
const isUuid = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const CHECK_USER_EXISTS = `
query CheckUserExists($email: String!, $username: String!) {
  users(where: { _or: [{ email: { _eq: $email } }, { username: { _eq: $username } }] }, limit: 1) {
    id
  }
}
`;

const CHECK_ORG_EXISTS = `
query CheckOrgExists($orgId: uuid!) {
  organizations_by_pk(id: $orgId) {
    id
  }
}
`;

const INSERT_USER = `
mutation InsertUser($object: users_insert_input!) {
  insert_users_one(object: $object) {
    id
    email
    role
  }
}
`;

export const POST = withRole("Super Admin", async (request) => {
  try {
    const { email, organization, fullName, username, password, role } =
      await request.json();

    if (!email || !organization || !fullName || !username || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!isUuid(organization)) {
      return NextResponse.json(
        { message: "Invalid organization. Please select an organization from the list." },
        { status: 400 }
      );
    }

    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // Confirm org exists
    const orgRes = await hasuraFetch(
      CHECK_ORG_EXISTS,
      { orgId: organization },
      { admin: true }
    );
    if (!orgRes.organizations_by_pk) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 400 }
      );
    }

    // Uniqueness: email OR username
    const existsRes = await hasuraFetch(
      CHECK_USER_EXISTS,
      { email, username },
      { admin: true }
    );

    if (existsRes.users?.length) {
      return NextResponse.json(
        { message: "User already exists (email or username)" },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const inserted = await hasuraFetch(
      INSERT_USER,
      {
        object: {
          email,
          username,
          full_name: fullName,
          organization_id: organization,
          password_hash,
          role,
        },
      },
      { admin: true }
    );

    const newUser = inserted.insert_users_one;

    return NextResponse.json(
      {
        message: "User created successfully",
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
});
