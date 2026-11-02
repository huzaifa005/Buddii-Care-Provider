/**
 * Returns `next` only if it is a same-origin path, otherwise `/`.
 * Prevents open redirects such as `/login?next=https://evil.example` or `//evil.example`.
 */
export function safeRedirectPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/"
  try {
    const url = new URL(next, "http://placeholder.local")
    if (url.origin !== "http://placeholder.local" || url.pathname.startsWith("/login")) return "/"
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/"
  }
}

export function loginPath(next?: string) {
  const target = safeRedirectPath(next)
  return target === "/" ? "/login" : `/login?next=${encodeURIComponent(target)}`
}
