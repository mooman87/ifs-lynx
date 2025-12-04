import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";

export const GET = withUser(async (_request, user) => {
  return NextResponse.json(
    {
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        organization: user.organization
          ? {
            id: user.organization._id?.toString() || user.organization.toString(),
            name: user.organization.name ?? undefined,
          }
          : null,
      }, 
    },
    { status: 200 }
  );
}); 
