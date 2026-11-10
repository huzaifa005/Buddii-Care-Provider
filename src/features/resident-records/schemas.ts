import { z } from "zod"

import { DOCUMENT_TYPES, documentSchema } from "@/features/referrals/assessment"

/**
 * Records a provider keeps for each resident and shares with the Council: wellbeing
 * assessments (baseline and reviews, form v0.2) and supporting documents. The provider sends;
 * only the Council marks an item Verified.
 */

export const ASSESSMENT_KINDS = ["BASELINE", "REVIEW_3M", "REVIEW_6M"] as const
export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number]

export const RECORD_STATUSES = ["RECEIVED", "INFO_REQUESTED", "VERIFIED"] as const
export type RecordStatus = (typeof RECORD_STATUSES)[number]

export const assessmentRecordSchema = z.object({
  id: z.string(),
  residentId: z.string(),
  kind: z.enum(ASSESSMENT_KINDS),
  status: z.enum(RECORD_STATUSES),
  submittedAt: z.iso.date(),
  completedBy: z.string(),
  /** Answers the Council reviewer must look at (review and flag rules). */
  reviewFlags: z.number().int().nonnegative(),
  notKnown: z.number().int().nonnegative(),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  councilNote: z.string().nullable(),
})
export type AssessmentRecord = z.infer<typeof assessmentRecordSchema>

export const newAssessmentSchema = z.object({
  kind: z.enum(ASSESSMENT_KINDS),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  documents: z.array(documentSchema),
  completedBy: z.string().trim().min(2),
})
export type NewAssessment = z.infer<typeof newAssessmentSchema>

export const residentDocumentSchema = z.object({
  id: z.string(),
  residentId: z.string(),
  name: z.string(),
  size: z.number().int().nonnegative(),
  type: z.enum(DOCUMENT_TYPES),
  version: z.number().int().positive(),
  uploadedAt: z.iso.date(),
  uploadedBy: z.string(),
  status: z.enum(RECORD_STATUSES),
})
export type ResidentDocument = z.infer<typeof residentDocumentSchema>

export const newDocumentSchema = documentSchema
export type NewDocument = z.infer<typeof newDocumentSchema>

export const ASSESSMENT_KIND_LABEL: Record<AssessmentKind, string> = {
  BASELINE: "Baseline assessment",
  REVIEW_3M: "3-month review",
  REVIEW_6M: "6-month review",
}

/**
 * Sections each kind asks. Reviews repeat consent, the safety screen and the outcome measures
 * (G1 to G4 are asked again at 3 and 6 months, per the form), plus social contact and goals.
 */
export const KIND_SECTIONS: Record<AssessmentKind, readonly string[]> = {
  BASELINE: [
    "consent",
    "reason",
    "safety",
    "independence",
    "mobility",
    "loneliness",
    "emotional",
    "social",
    "memory",
    "support",
    "preferences",
    "goals",
  ],
  REVIEW_3M: ["consent", "safety", "loneliness", "emotional", "social", "goals"],
  REVIEW_6M: ["consent", "safety", "loneliness", "emotional", "social", "goals"],
}
