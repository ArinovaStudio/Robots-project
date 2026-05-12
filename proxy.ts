import { NextRequest, NextResponse } from "next/server";

import { getUser } from "./lib/auth";

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Public pages
  const publicPages = ["/", "/login", "/signup"];

  if (publicPages.includes(pathname)) {
    return NextResponse.next();
  }

  const { user } = await getUser();

  // Not logged in
  if (!user) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  // Admin protection
  if (pathname.startsWith("/admin")) {
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(
        new URL("/explore", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};