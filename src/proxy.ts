import { type NextRequest, NextResponse } from "next/server"

/**
 * Optimistic auth check: send visitors without a session cookie to /login before any page
 * renders. This only checks that the cookie exists. Real authentication and authorisation
 * happen in the Django API on every request (a stale cookie still gets a 401 there, which the
 * browser turns into a redirect too).
 *
 * The cookie must be visible to this app's domain, so in production the API sets it with a
 * shared parent domain (for example `Domain=.buddii.co.uk`).
 */
const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "sessionid"
// With mock data there is no real session cookie; the mock /me endpoint plays that role.
const mocking = process.env.NEXT_PUBLIC_API_MOCKING === "enabled"

export function proxy(request: NextRequest) {
  if (mocking || request.cookies.has(SESSION_COOKIE)) return NextResponse.next()

  const { pathname, search } = request.nextUrl
  const login = new URL("/login", request.url)
  if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`)
  return NextResponse.redirect(login)
}

export const config = {
  // Everything except the login page, Next internals, static files and the mock worker.
  matcher: ["/((?!login|_next/static|_next/image|brand/|favicon.ico|mockServiceWorker.js).*)"],
}
