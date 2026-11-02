import { networkInterfaces } from "node:os"

import type { NextConfig } from "next"

const isDev = process.env.NODE_ENV === "development"

/**
 * This machine's LAN IPv4 addresses. The dev server serves its scripts only to allowed origins,
 * so without these the app opened on the "Network" URL (e.g. a phone) never hydrates.
 * Dev only; production does not use this list.
 */
const lanOrigins = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net?.family === "IPv4" && !net.internal)
  .map((net) => net!.address)

/**
 * Origin of the Django API when it is not served from this app's origin
 * (e.g. https://api.buddii.co.uk). Added to connect-src so the browser may call it.
 */
const apiOrigin = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url || url.startsWith("/")) return ""
  try {
    return new URL(url).origin
  } catch {
    return ""
  }
})()

/**
 * Content Security Policy without nonces, so pages stay statically prerendered.
 * 'unsafe-inline' for scripts is needed for Next's inline bootstrap without nonces; see
 * docs/SECURITY.md for the upgrade path (nonce via proxy, or experimental SRI).
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ""}${isDev ? " ws:" : ""}`,
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ")

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev
    ? []
    : [
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      ]),
]

const nextConfig: NextConfig = {
  allowedDevOrigins: lanOrigins,
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    // Residents replaced "Buddii Clients" (council terminology). Old links keep working.
    return [
      { source: "/clients", destination: "/residents", permanent: false },
      { source: "/clients/:id", destination: "/residents/:id", permanent: false },
    ]
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
}

export default nextConfig
