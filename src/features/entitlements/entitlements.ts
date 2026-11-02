import { z } from "zod"

/**
 * Commercial entitlement codes, flipped by Super Admin when an agreement is signed.
 *
 * The frontend only uses these to decide what to show. The Django API is the
 * enforcement point: a missing entitlement must produce a 403 there, regardless of UI.
 */
export const ENTITLEMENT_CODES = [
  "BUDDII_PROVIDER_CORE",
  "CARE_MANAGEMENT_PRO",
  "EVV_GPS_PRO",
  "MEDICATION_PRO",
  "CARER_COMPLIANCE_PRO",
  "ADVANCED_REPORTING",
  "API_INTEGRATION",
  "MULTI_SITE_MANAGEMENT",
] as const

export const entitlementCodeSchema = z.enum(ENTITLEMENT_CODES)

export type EntitlementCode = z.infer<typeof entitlementCodeSchema>

export function hasEntitlement(granted: readonly EntitlementCode[], required: EntitlementCode) {
  return granted.includes(required)
}
