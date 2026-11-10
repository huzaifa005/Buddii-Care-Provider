import { z } from "zod"

import { buddiiIdSchema, outcomeScoreSchema } from "@/features/residents/schemas"

export const activityStatusSchema = z.enum(["COMPLETED", "IN_PROGRESS", "SCHEDULED", "MISSED"])
export type ActivityStatus = z.infer<typeof activityStatusSchema>

/** A volunteer visit. Volunteer-recorded content only; no clinical or regulated visit data. */
export const activityRecordSchema = z.object({
  id: z.string(),
  residentId: buddiiIdSchema,
  type: z.string(),
  volunteerRef: z.string(),
  scheduledAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().positive().nullable(),
  status: activityStatusSchema,
  wellbeingScore: outcomeScoreSchema.nullable(),
  observation: z.string().nullable(),
  needsResponse: z.boolean(),
  providerResponse: z
    .object({ text: z.string(), respondedAt: z.iso.datetime({ offset: true }), by: z.string() })
    .nullable(),
})
export type ActivityRecord = z.infer<typeof activityRecordSchema>

export const ACTIVITY_FILTERS = ["all", "today", "upcoming", "needs_response", "missed"] as const
export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number]

export const activityListSchema = z.object({
  counts: z.record(z.enum(ACTIVITY_FILTERS), z.number().int()),
  stats: z.object({
    completedThisMonth: z.number().int(),
    hoursThisMonth: z.number(),
    upcomingSevenDays: z.number().int(),
    awaitingResponse: z.number().int(),
  }),
  results: z.array(activityRecordSchema),
})

export const providerResponseInputSchema = z.object({
  response: z.string().trim().min(10, "Add at least a short note on what you will do"),
  followUp: z.enum(["NONE", "WELFARE_CHECK", "COORDINATOR_REVIEW", "SAFEGUARDING"]),
})
export type ProviderResponseInput = z.infer<typeof providerResponseInputSchema>
