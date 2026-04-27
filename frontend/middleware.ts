import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { UI_SESSION_COOKIE } from "@/lib/api";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/verify-email",
  "/consent",
  "/error",
  "/_next",
  "/favicon.ico",
];

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  for (const p of PUBLIC_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

function isStaticAsset(pathname: string): boolean {
  return /\.(ico|png|jpg|jpeg|svg|webp|gif|txt|xml|webmanifest)$/i.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/developer" || pathname.startsWith("/developer/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/developer/, "/projects") || "/projects";
    return NextResponse.redirect(url);
  }

  if (pathname === "/console" || pathname.startsWith("/console/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/console/, "/projects") || "/projects";
    return NextResponse.redirect(url);
  }

  if (isPublicPath(pathname) || isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  const hasUiSession = request.cookies.get(UI_SESSION_COOKIE)?.value === "1";
  if (!hasUiSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const returnTo = `${pathname}${search || ""}`;
    if (returnTo !== "/login") {
      url.searchParams.set("return_to", returnTo);
    }
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
