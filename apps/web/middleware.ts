import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const protectedPrefixes = [
  "/dashboard",
  "/discover",
  "/projects",
  "/clips",
  "/calendar",
  "/accounts",
  "/brand-kits",
  "/analytics",
  "/settings",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (isProtected && req.auth === null) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname === "/sign-in" && req.auth !== null) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/discover/:path*",
    "/projects/:path*",
    "/clips/:path*",
    "/calendar/:path*",
    "/accounts/:path*",
    "/brand-kits/:path*",
    "/analytics/:path*",
    "/settings/:path*",
    "/sign-in",
  ],
};
