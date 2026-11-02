import { z } from "zod"

/** Council programme assignment. Confirming it is programme participation, not care commissioning. */
export const assignmentSchema = z.object({
  id: z.string(),
  councilRef: z.string(),
  ageBand: z.string(),
  postcodeDistrict: z.string(),
  goals: z.array(z.string()),
  context: z.string(),
  receivedAt: z.iso.date(),
  status: z.enum(["PENDING", "CONFIRMED", "DECLINED"]),
  respondedAt: z.iso.date().nullable(),
  declineReason: z.string().nullable(),
})
export type Assignment = z.infer<typeof assignmentSchema>
export type AssignmentStatus = Assignment["status"]

export const assignmentListSchema = z.object({
  counts: z.object({ PENDING: z.number(), CONFIRMED: z.number(), DECLINED: z.number() }),
  results: z.array(assignmentSchema),
})

export const DECLINE_REASONS = [
  "Over capacity at this time",
  "Outside our service area",
  "Resident needs do not match our programme",
  "Other",
] as const

export const confirmAssignmentInputSchema = z.object({
  contact: z.enum(["PROVIDER_ADMINISTRATOR", "PROVIDER_COORDINATOR"]),
  notes: z.string().trim().max(500),
})
export type ConfirmAssignmentInput = z.infer<typeof confirmAssignmentInputSchema>

export const declineAssignmentInputSchema = z.object({
  reason: z.enum(DECLINE_REASONS),
  notes: z.string().trim().max(500),
})
export type DeclineAssignmentInput = z.infer<typeof declineAssignmentInputSchema>
