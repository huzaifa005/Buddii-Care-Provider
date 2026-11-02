import { z } from "zod"

/**
 * Public runtime configuration, validated once at module load so a misconfigured
 * deployment fails loudly instead of silently calling the wrong API.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so each one has to be referenced
 * by its full name here (no dynamic `process.env[key]` access).
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1).default("/api/v1"),
  NEXT_PUBLIC_API_MOCKING: z.enum(["enabled", "disabled"]).default("disabled"),
})

export const env = publicEnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_API_MOCKING: process.env.NEXT_PUBLIC_API_MOCKING,
})

/**
 * Mock API (demo data only, no real records). On by default in development via .env.local.
 * A production build mocks only when the deploy sets NEXT_PUBLIC_API_MOCKING=enabled, e.g. the
 * Netlify test site. A real deployment leaves it unset or "disabled".
 */
export const isApiMockingEnabled = env.NEXT_PUBLIC_API_MOCKING === "enabled"
