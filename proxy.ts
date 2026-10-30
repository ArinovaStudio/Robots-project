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
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname === "/llms.txt" ||
    pathname.endsWith(".webmanifest") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // 2. Read NextAuth JWT token (Edge & middleware safe)
  const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
  let token = await getToken({ req, secret });
  if (!token) {
    token = await getToken({ req, secret, secureCookie: true });
  }
  const isAuthenticated = !!token;

  // 3. Onboarded users visiting the landing page go to the app.
  // Incomplete users must be able to leave onboarding and return to the public landing page.
  if (isAuthenticated && token?.isOnboarded !== false && pathname === "/") {
    const exploreUrl = req.nextUrl.clone();
    exploreUrl.pathname = "/explore";
    return NextResponse.redirect(exploreUrl);
  }

  // 4. Public indexable pages allowed for everyone (visitors & search crawlers)
  const isPublicPath =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/signup/investor" ||
    pathname === "/register" ||
    pathname === "/register/company" ||
    pathname === "/forgot-password" ||
    pathname === "/resend-otp" ||
    pathname === "/directory" ||
    pathname === "/explore" ||
    pathname === "/marketplace" ||
    pathname === "/collaborate" ||
    pathname === "/investors" ||
    pathname.startsWith("/profile/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname === "/llms.txt";

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 5. Private pages require authentication
  if (!isAuthenticated) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    const callback = req.nextUrl.pathname + req.nextUrl.search;
    if (callback && callback !== "/") {
      loginUrl.searchParams.set("callbackUrl", callback);
    }
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|manifest.json|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf)).*)",
  ],
};