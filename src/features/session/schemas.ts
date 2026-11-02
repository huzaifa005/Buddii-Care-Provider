import { z } from "zod"

import { entitlementCodeSchema } from "@/features/entitlements/entitlements"

export const PROVIDER_ROLES = [
  "PROVIDER_ADMINISTRATOR",
  "PROVIDER_COORDINATOR",
  "PROVIDER_PRACTITIONER",
  "PROVIDER_REPORTING_USER",
  "CARE_OPERATIONS_USER",
] as const

/**
 * Roles a provider administrator can give in the free portal (v10 section 3.2).
 * Care Operations User exists only in Care Buddii Pro; the session still accepts it so a
 * Pro-licensed user can sign in.
 */
export const FREE_PORTAL_ROLES = [
  "PROVIDER_ADMINISTRATOR",
  "PROVIDER_COORDINATOR",
  "PROVIDER_PRACTITIONER",
  "PROVIDER_REPORTING_USER",
] as const satisfies readonly (typeof PROVIDER_ROLES)[number][]

export const providerRoleSchema = z.enum(PROVIDER_ROLES)
export const freePortalRoleSchema = z.enum(FREE_PORTAL_ROLES)
export type ProviderRole = z.infer<typeof providerRoleSchema>

export const PROVIDER_ROLE_LABELS: Record<ProviderRole, string> = {
  PROVIDER_ADMINISTRATOR: "Provider Administrator",
  PROVIDER_COORDINATOR: "Provider Coordinator",
  PROVIDER_PRACTITIONER: "Provider Practitioner",
  PROVIDER_REPORTING_USER: "Provider Reporting User",
  CARE_OPERATIONS_USER: "Care Operations User",
}

export const sessionSchema = z.object({
  user: z.object({
    id: z.string(),
    displayName: z.string(),
    email: z.email(),
    role: providerRoleSchema,
  }),
  organisation: z.object({
    id: z.string(),
    name: z.string(),
    /** The council programme this provider participates in, e.g. "Newham". */
    programme: z.string(),
  }),
  entitlements: z.array(entitlementCodeSchema),
})

export type Session = z.infer<typeof sessionSchema>
