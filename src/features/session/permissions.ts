import { type ProviderRole } from "./schemas"

/**
 * What each provider role may do in the free Provider Portal.
 *
 * PROPOSAL pending sign-off (handoff deliverable 4: role and permission matrix). The Django
 * API is the source of truth and must enforce the same rules; this map only decides which
 * controls the UI shows. Change it in one place when the matrix is agreed.
 */
export const CAPABILITIES = [
  "assignments.respond",
  "referrals.create",
  "requests.create",
  "requests.cancel",
  "activity.respond",
  "safeguarding.report",
  "messages.send",
  "reports.generate",
  "reports.safeguarding",
  "users.manage",
] as const
export type Capability = (typeof CAPABILITIES)[number]

const ALL: readonly Capability[] = CAPABILITIES

export const ROLE_CAPABILITIES: Record<ProviderRole, readonly Capability[]> = {
  PROVIDER_ADMINISTRATOR: ALL,
  PROVIDER_COORDINATOR: [
    "assignments.respond",
    "referrals.create",
    "requests.create",
    "requests.cancel",
    "activity.respond",
    "safeguarding.report",
    "messages.send",
    "reports.generate",
  ],
  PROVIDER_PRACTITIONER: [
    "referrals.create",
    "requests.create",
    "activity.respond",
    "safeguarding.report",
    "messages.send",
  ],
  PROVIDER_REPORTING_USER: ["reports.generate"],
  // Care Buddii Pro role: in the free portal it can only raise safeguarding concerns.
  CARE_OPERATIONS_USER: ["safeguarding.report"],
}

export function can(role: ProviderRole, capability: Capability) {
  return ROLE_CAPABILITIES[role].includes(capability)
}
