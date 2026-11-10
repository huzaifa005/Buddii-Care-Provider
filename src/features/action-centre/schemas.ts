import { z } from "zod"

import { documentSchema } from "@/features/referrals/assessment"

export const ACTION_KINDS = ["INFO_REQUEST", "ASSIGNMENT", "REVIEW_DUE", "OBSERVATION"] as const
export type ActionKind = (typeof ACTION_KINDS)[number]

export const ACTION_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const
export type ActionPriority = (typeof ACTION_PRIORITIES)[number]

export const ACTION_STATUSES = ["OPEN", "REPLIED"] as const
export type ActionStatus = (typeof ACTION_STATUSES)[number]

export const actionReplySchema = z.object({
  message: z.string(),
  files: z.array(documentSchema),
  at: z.iso.datetime({ offset: true }),
  by: z.string(),
})

/**
 * One thing the provider has to do, collected from its source (Council request, assignment,
 * review date or volunteer observation). Every action deep-links to that source; actions that
 * need a decision there (confirm an assignment, respond to an observation) close from the source.
 */
export const actionSchema = z.object({
  id: z.string(),
  kind: z.enum(ACTION_KINDS),
  priority: z.enum(ACTION_PRIORITIES),
  title: z.string(),
  detail: z.string(),
  /** Null for people who are not residents yet (referrals, new assignments). */
  residentId: z.string().nullable(),
  residentName: z.string(),
  sourceRef: z.string(),
  /** Where the work is done, e.g. the assessment or the assignments page. */
  href: z.string(),
  raisedAt: z.iso.date(),
  dueAt: z.iso.date().nullable(),
  raisedBy: z.string(),
  status: z.enum(ACTION_STATUSES),
  /** Council info requests are answered here, with a message and files. */
  canReply: z.boolean(),
  reply: actionReplySchema.nullable(),
})
export type Action = z.infer<typeof actionSchema>

export const actionListSchema = z.array(actionSchema)

export const actionReplyInputSchema = z.object({
  message: z.string().trim().min(1, "Write a reply for the Council").max(1000),
  files: z.array(documentSchema).max(10),
})
export type ActionReplyInput = z.infer<typeof actionReplyInputSchema>
