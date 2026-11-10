import { z } from "zod"

import { buddiiIdSchema } from "@/features/residents/schemas"

/** Volunteer-safe support only. Personal care, medication and clinical tasks are out of scope. */
export const SUPPORT_TYPES = [
  "Companionship visit",
  "Telephone check-in",
  "Shopping support",
  "Social engagement",
  "Reading or hobbies",
  "Digital help",
  "Community activity",
  "Light practical support",
  "Appointment accompaniment",
] as const

export const REQUEST_STATUSES = [
  "COORDINATOR_REVIEW",
  "MATCHING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const

export const supportRequestSchema = z.object({
  id: z.string(),
  residentId: buddiiIdSchema,
  type: z.enum(SUPPORT_TYPES),
  goal: z.string(),
  frequency: z.enum(["WEEKLY", "FORTNIGHTLY", "ONE_OFF"]),
  preferredTime: z.enum(["MORNING", "AFTERNOON", "EITHER"]),
  riskLevel: z.enum(["STANDARD", "ELEVATED"]),
  status: z.enum(REQUEST_STATUSES),
  volunteerRef: z.string().nullable(),
  createdAt: z.iso.date(),
  reviewDate: z.iso.date().nullable(),
})
export type SupportRequest = z.infer<typeof supportRequestSchema>
export type RequestStatus = SupportRequest["status"]

export const supportRequestListSchema = z.object({
  counts: z.record(z.enum(REQUEST_STATUSES), z.number().int()),
  results: z.array(supportRequestSchema),
})

export const newSupportRequestSchema = z.object({
  residentId: z.string().min(1, "Choose a resident"),
  // The form starts empty (""); the pipe rejects that with a friendly message on submit.
  type: z
    .union([z.literal(""), z.enum(SUPPORT_TYPES)])
    .pipe(z.enum(SUPPORT_TYPES, { error: "Choose the type of support" })),
  goal: z.string().trim().min(10, "Describe the goal in a sentence"),
  frequency: z.enum(["WEEKLY", "FORTNIGHTLY", "ONE_OFF"]),
  preferredTime: z.enum(["MORNING", "AFTERNOON", "EITHER"]),
  context: z.string().trim().max(600),
  riskLevel: z.enum(["STANDARD", "ELEVATED"]),
  consentConfirmed: z
    .boolean()
    .refine((confirmed) => confirmed, "Consent must be confirmed before submitting"),
})
export type NewSupportRequestInput = z.input<typeof newSupportRequestSchema>
export type NewSupportRequest = z.output<typeof newSupportRequestSchema>
