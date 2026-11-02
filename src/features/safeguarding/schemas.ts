import { z } from "zod"

import { buddiiIdSchema } from "@/features/clients/schemas"

export const CONCERN_CATEGORIES = [
  "Physical welfare",
  "Self-neglect",
  "Financial abuse",
  "Psychological abuse",
  "Unexplained deterioration",
  "Capacity concern",
  "Other",
] as const

export const concernSchema = z.object({
  id: z.string(),
  clientId: buddiiIdSchema,
  category: z.enum(CONCERN_CATEGORIES),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM"]),
  description: z.string(),
  status: z.enum(["SUBMITTED", "ROUTED", "UNDER_REVIEW", "CLOSED"]),
  routedTo: z.string().nullable(),
  raisedAt: z.iso.datetime({ offset: true }),
  raisedBy: z.string(),
  timeline: z.array(z.object({ at: z.iso.datetime({ offset: true }), event: z.string() })),
})
export type Concern = z.infer<typeof concernSchema>

export const newConcernSchema = z.object({
  clientId: z.string().min(1, "Choose a resident"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM"]),
  category: z.enum(CONCERN_CATEGORIES),
  description: z.string().trim().min(20, "Describe what was observed, when and by whom"),
})
export type NewConcern = z.infer<typeof newConcernSchema>
