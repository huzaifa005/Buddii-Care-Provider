import { z } from "zod"

import { buddiiIdSchema } from "@/features/clients/schemas"

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
  clients: z.array(
    z.object({
      clientId: buddiiIdSchema,
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
