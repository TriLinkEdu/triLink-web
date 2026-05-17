import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware that gates the authenticated portals.
 *
 * The backend issues a non-httpOnly `trilink_has_session` cookie alongside the
 * httpOnly access/refresh cookies on login (see backend auth-cookies.ts). This
 * middleware only needs to know "does a session exist" — it does NOT touch the
 * JWT itself. Token validity is still enforced by the backend on every request.
 *
 * If the cookie is missing for a protected route, redirect to the role-scoped
 * login page (admin/teacher/student/parent).
 *
 * NOTE: This is a pragmatic transition step. While the legacy localStorage-only
 * clients still exist, the middleware also looks for a `trilink_access_hint`
 * header set by the client SDK during early refactors. Remove once cookies are
 * universal across all clients.
 */

const SESSION_FLAG_COOKIE = "trilink_has_session";

const ROLE_PREFIXES = ["admin", "teacher", "student", "parent"] as const;

const PUBLIC_PATHS: ReadonlyArray<string> = [
  "/",
  "/api/send-email",
  "/reset-password",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // login pages: /admin/login, /teacher/login, etc.
  for (const role of ROLE_PREFIXES) {
    if (pathname === `/${role}/login` || pathname.startsWith(`/${role}/login?`)) {
      return true;
    }
  }
  return false;
}

function requiresAuth(pathname: string): boolean {
  for (const role of ROLE_PREFIXES) {
    if (pathname.startsWith(`/${role}/`) || pathname === `/${role}`) {
      // role login pages are public
      if (pathname === `/${role}/login`) return false;
      return true;
    }
  }
  return false;
}

function roleFromPath(pathname: string): string {
  for (const role of ROLE_PREFIXES) {
    if (pathname.startsWith(`/${role}`)) return role;
  }
  return "admin";
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (isPublic(pathname) || !requiresAuth(pathname)) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.get(SESSION_FLAG_COOKIE)?.value === "1";
  if (hasSession) return NextResponse.next();

  // Soft-fail the middleware while localStorage-only clients are still live:
  // those clients don't have the cookie yet but do have an in-memory token.
  // We let the request through; client-side layouts will redirect on 401.
  // Toggle `STRICT_MIDDLEWARE=true` once all clients have the cookie.
  if (process.env.NEXT_PUBLIC_STRICT_MIDDLEWARE !== "true") {
    return NextResponse.next();
  }

  const role = roleFromPath(pathname);
  const loginUrl = new URL(`/${role}/login`, req.url);
  loginUrl.searchParams.set("next", pathname + (search || ""));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Skip:
     *  - Next.js internals (_next, _vercel)
     *  - public files (favicon, robots, sitemap, images)
     *  - API routes (they handle their own auth)
     */
    "/((?!_next|_vercel|.*\\..*|favicon.ico|robots.txt|sitemap.xml|api).*)",
  ],
};
