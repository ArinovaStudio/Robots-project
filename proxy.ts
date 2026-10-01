import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // 1. Immediately pass all API routes & static files through without interference
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  ) {
    return NextResponse.next();
  }

  // 2. Read NextAuth JWT token (Edge & middleware safe)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  // 3. If logged in and visiting landing page "/", redirect to "/explore"
  if (isAuthenticated && pathname === "/") {
    const exploreUrl = req.nextUrl.clone();
    exploreUrl.pathname = "/explore";
    return NextResponse.redirect(exploreUrl);
  }

  // 4. Public indexable pages allowed for everyone (visitors & search crawlers)
  const isPublicPath =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/directory" ||
    pathname === "/explore" ||
    pathname === "/marketplace" ||
    pathname === "/collaborate" ||
    pathname === "/investors" ||
    pathname.startsWith("/profile/");

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 5. Private pages require authentication
  if (!isAuthenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // 6. Admin protection
  if (pathname.startsWith("/admin")) {
    if (token?.role !== "ADMIN") {
      const exploreUrl = req.nextUrl.clone();
      exploreUrl.pathname = "/explore";
      return NextResponse.redirect(exploreUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};