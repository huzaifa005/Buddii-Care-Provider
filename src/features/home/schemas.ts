import { z } from "zod"

import { buddiiIdSchema, outcomeScoreSchema } from "@/features/residents/schemas"

export const actionPrioritySchema = z.enum(["HIGH", "MEDIUM", "LOW"])
export type ActionPriority = z.infer<typeof actionPrioritySchema>

/** One item the provider needs to act on, aggregated by the API across features. */
export const actionItemSchema = z.object({
  id: z.string(),
  priority: actionPrioritySchema,
  title: z.string(),
  detail: z.string(),
  relatedTo: z.object({
    ref: z.string(),
    kind: z.enum(["RESIDENT", "ASSIGNMENT", "SUPPORT_REQUEST", "CONCERN", "THREAD"]),
  }),
  due: z.iso.date().nullable(),
  cta: z.enum(["REVIEW", "RESPOND", "CONFIRM", "REPLY", "OPEN"]),
  href: z.string(),
})
export type ActionItem = z.infer<typeof actionItemSchema>

export const visitStatusSchema = z.enum(["COMPLETED", "IN_PROGRESS", "SCHEDULED", "MISSED"])
export type VisitStatus = z.infer<typeof visitStatusSchema>

export const visitSchema = z.object({
  id: z.string(),
  residentId: buddiiIdSchema,
  type: z.string(),
  postcodeDistrict: z.string(),
  volunteerRef: z.string(),
  scheduledAt: z.iso.datetime({ offset: true }),
  durationMinutes: z.number().int().positive(),
  wellbeingScore: outcomeScoreSchema.nullable(),
  status: visitStatusSchema,
})
export type Visit = z.infer<typeof visitSchema>

/** A council programme assignment awaiting the provider's confirmation. Not care commissioning. */
export const pendingAssignmentSchema = z.object({
  id: z.string(),
  councilRef: z.string(),
  residentName: z.string(),
  area: z.string(),
  ageBand: z.string(),
  postcodeDistrict: z.string(),
  goals: z.array(z.string()),
  receivedAt: z.iso.date(),
})
export type PendingAssignment = z.infer<typeof pendingAssignmentSchema>

/** A KPI with its previous-period value and recent history (oldest first) for the sparkline. */
const trendMetric = z.object({
  current: z.number(),
  previous: z.number().nullable(),
  series: z.array(z.number()),
})

export const dashboardSummarySchema = z.object({
  metrics: z.object({
    activeResidents: trendMetric,
    volunteerHoursThisMonth: trendMetric,
    visitsCompletedThisMonth: trendMetric.extend({ scheduled: z.number().int() }),
    averageWellbeing: trendMetric,
  }),
  actions: z.array(actionItemSchema),
  todayVisits: z.array(visitSchema),
  pendingAssignments: z.array(pendingAssignmentSchema),
  volunteerHours: z.object({
    weeks: z.array(z.object({ weekStart: z.iso.date(), hours: z.number() })),
  }),
})
export type DashboardSummary = z.infer<typeof dashboardSummarySchema>
