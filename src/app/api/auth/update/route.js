// app/api/auth/update/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withUser } from "@/utils/auth";
import { hasuraFetch } from "@/utils/hasura";

const GET_PASSWORD_HASH = `
query GetUserPassword($id: uuid!) {
  users_by_pk(id: $id) {
    id
    password_hash
  }
}
`;

const UPDATE_PASSWORD_HASH = `
mutation UpdatePassword($id: uuid!, $password_hash: String!) {
  update_users_by_pk(pk_columns: { id: $id }, _set: { password_hash: $password_hash }) {
    id
  }
}
`;

export const PUT = withUser(async (req, user) => {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const data = await hasuraFetch(
      GET_PASSWORD_HASH,
      { id: user.id },
      { admin: true }
    );

    const dbUser = data.users_by_pk;
    if (!dbUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const ok = await bcrypt.compare(currentPassword, dbUser.password_hash);
    if (!ok) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);

    await hasuraFetch(
      UPDATE_PASSWORD_HASH,
      { id: user.id, password_hash },
      { admin: true }
    );

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
});
