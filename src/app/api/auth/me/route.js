import { NextResponse } from "next/server";
import { withUser } from "@/utils/auth";

export const GET = withUser(async (_request, user) => {
  try {
    return NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organization: user.organization
            ? {
              id: user.organization._id?.toString() || user.organization.toString(),
              name: user.organization.name,
              slug: user.organization.slug,
              orgType: user.organization.settings?.orgType || null,
            }
            : null,
        }, 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("error @ auth/me: ", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}); 
