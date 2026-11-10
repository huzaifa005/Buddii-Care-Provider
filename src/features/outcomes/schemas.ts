import { z } from "zod"

import { buddiiIdSchema } from "@/features/residents/schemas"

const metric = z.object({
  current: z.number(),
  previous: z.number().nullable(),
  series: z.array(z.number()),
})

/** Volunteer-observed programme outcomes. Not clinical assessments. */
export const outcomesSummarySchema = z.object({
  metrics: z.object({
    averageWellbeing: metric,
    averageLoneliness: metric,
    averageConfidence: metric,
    volunteerHours: metric,
    goalsProgressing: metric.extend({ total: z.number().int() }),
  }),
  monthly: z.array(
    z.object({
      month: z.iso.date(),
      wellbeing: z.number(),
      loneliness: z.number(),
      confidence: z.number(),
    }),
  ),
  hoursByType: z.array(z.object({ type: z.string(), hours: z.number() })),
  residents: z.array(
    z.object({
      residentId: buddiiIdSchema,
      wellbeingStart: z.number().nullable(),
      wellbeingNow: z.number().nullable(),
      lonelinessStart: z.number().nullable(),
      lonelinessNow: z.number().nullable(),
      confidenceStart: z.number().nullable(),
      confidenceNow: z.number().nullable(),
      hours: z.number(),
      goalStatus: z.enum(["PROGRESSING", "STEADY", "NEEDS_REVIEW", "NOT_STARTED"]),
    }),
  ),
})
export type OutcomesSummary = z.infer<typeof outcomesSummarySchema>

const scorePair = (min: number, max: number) =>
  z.object({
    baseline: z.number().min(min).max(max).nullable(),
    latest: z.number().min(min).max(max).nullable(),
  })

/**
 * Outcomes v2: per-resident scores from Council-verified wellbeing assessments.
 * WEMWBS is 14-70 (higher is better); UCLA 3-item loneliness is 3-9 (lower is better).
 * The volunteer 1-5 rating is a "Visit check" only, never an assessment score.
 */
export const outcomesAssessmentsSchema = z.object({
  /** Date the Council last verified an assessment in this data. */
  asOf: z.iso.date(),
  residents: z.array(
    z.object({
      residentId: buddiiIdSchema,
      name: z.string(),
      area: z.string(),
      wemwbs: scorePair(14, 70),
      ucla: scorePair(3, 9),
      visitCheck: scorePair(1, 5),
      lastVerifiedAt: z.iso.date().nullable(),
      nextReviewDue: z.iso.date().nullable(),
    }),
  ),
})
export type OutcomesAssessments = z.infer<typeof outcomesAssessmentsSchema>
export type ResidentOutcome = OutcomesAssessments["residents"][number]
