import { z } from "zod"

import { buddiiIdSchema } from "@/features/clients/schemas"
import { SUPPORT_TYPES } from "@/features/support-requests/schemas"

/**
 * Provider referrals (v10 section 6.1): the provider refers a resident, the council reviews it
 * and creates the Buddii client account. Providers never create client accounts themselves.
 *
 * A referral carries no name, address or clinical detail. The provider's own reference lets the
 * council match it to the provider's records outside Buddii.
 */

export const AGE_BANDS = [
  "60-64",
  "65-69",
  "70-74",
  "75-79",
  "80-84",
  "85-89",
  "90-94",
  "95+",
] as const

export const REFERRAL_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "DECLINED"] as const
export type ReferralStatus = (typeof REFERRAL_STATUSES)[number]

export const referralSchema = z.object({
  id: z.string(),
  providerRef: z.string(),
  ageBand: z.enum(AGE_BANDS),
  postcodeDistrict: z.string(),
  supportTypes: z.array(z.enum(SUPPORT_TYPES)).min(1),
  status: z.enum(REFERRAL_STATUSES),
  submittedAt: z.iso.date(),
  /** Set by the council when it approves the referral and creates the client account. */
  clientId: buddiiIdSchema.nullable(),
  councilNote: z.string().nullable(),
})
export type Referral = z.infer<typeof referralSchema>

export const referralListSchema = z.array(referralSchema)

/** UK outward code, e.g. E6, E12, EC1A. Full postcodes are not collected. */
const postcodeDistrictSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{1,2}\d[A-Z\d]?$/, "Enter the first part of the postcode only, e.g. E6")

export const newReferralSchema = z.object({
  providerRef: z
    .string()
    .trim()
    .min(2, "Enter your internal reference")
    .max(40, "Keep the reference under 40 characters"),
  ageBand: z.enum(AGE_BANDS, "Choose an age band"),
  postcodeDistrict: postcodeDistrictSchema,
  supportTypes: z.array(z.enum(SUPPORT_TYPES)).min(1, "Choose at least one type of support"),
  reason: z
    .string()
    .trim()
    .min(10, "Say briefly why volunteer support would help")
    .max(600, "Keep this under 600 characters"),
  consentConfirmed: z
    .boolean()
    .refine((confirmed) => confirmed, "The resident must agree before you refer them"),
})
export type NewReferralInput = z.input<typeof newReferralSchema>
export type NewReferral = z.output<typeof newReferralSchema>
