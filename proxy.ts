import { NextRequest, NextResponse } from "next/server";

import { getUser } from "./lib/auth";

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Public pages
  const publicPages = ["/login", "/signup", "/"];

  if (publicPages.includes(pathname) || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const { user } = await getUser();

  // Not logged in
  if (!user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Admin protection
  if (pathname.startsWith("/admin")) {
    if (user.role !== "ADMIN") {
      const exploreUrl = req.nextUrl.clone();
      exploreUrl.pathname = "/explore";
      return NextResponse.redirect(exploreUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};