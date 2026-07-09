import { NextRequest, NextResponse } from "next/server";

import { getUser } from "./lib/auth";

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const { user } = await getUser();

  const isRootPath = pathname === "/";
  const isAuthPage = ["/login", "/signup"].includes(pathname);

  if (isRootPath) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.redirect(new URL("/explore", req.url));
  }

  if (isAuthPage) {
    if (user) {
      return NextResponse.redirect(new URL("/explore", req.url));
    }

    return NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/explore", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
