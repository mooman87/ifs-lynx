import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
  matcher: ["/dashboard", "/project", "/employee", "/register", "/travel"],
};

export async function middleware(req) {
  const token = req.cookies.get("operatorToken")?.value;

  if (!token) {
    console.error("Token missing. Redirecting to login.");
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    const res = NextResponse.next();
    res.headers.set("x-user-data", JSON.stringify(payload));

    return res;
  } catch (err) {
    console.error("Token validation failed:", err.message);
    return NextResponse.redirect(new URL("/", req.url));
  }
}
