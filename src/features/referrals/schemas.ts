import { z } from "zod"

import { documentSchema, personSchema } from "./assessment"

/**
 * A resident the provider sends to the Council: identity (Section B), the Buddii Wellbeing
 * Assessment answers and supporting documents. The Council checks the information, recommends
 * and approves, then creates the resident record. Providers never create residents themselves.
 */

/** Council journey stages a referral passes through before it becomes a resident. */
export const REFERRAL_STAGES = [
  "SENT",
  "INFO_REQUESTED",
  "INFO_CHECKED",
  "RECOMMENDED",
  "APPROVED",
  "NOT_ACCEPTED",
] as const
export type ReferralStage = (typeof REFERRAL_STAGES)[number]

export const referralSchema = z.object({
  id: z.string(),
  residentName: z.string(),
  postcode: z.string(),
  stage: z.enum(REFERRAL_STAGES),
  submittedAt: z.iso.date(),
  documents: z.array(documentSchema),
  /** Answers the Council reviewer must look at (the form's review and flag rules). */
  reviewFlags: z.number().int().nonnegative(),
  /** Set when the Council approves the referral and creates the resident record. */
  residentId: z.string().nullable(),
  councilNote: z.string().nullable(),
})
export type Referral = z.infer<typeof referralSchema>

export const referralListSchema = z.array(referralSchema)

export const referralSubmissionSchema = z.object({
  person: personSchema,
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  documents: z.array(documentSchema),
  /** Who completed the form on the provider side (Section B2 and M). */
  completedBy: z.string().trim().min(2, "Enter your name"),
})
export type ReferralSubmission = z.infer<typeof referralSubmissionSchema>
