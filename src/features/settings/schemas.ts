import { z } from "zod"

import { freePortalRoleSchema, providerRoleSchema } from "@/features/session/schemas"

export const providerUserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  email: z.email(),
  role: providerRoleSchema,
  status: z.enum(["ACTIVE", "INVITED", "SUSPENDED"]),
  lastActiveAt: z.iso.datetime({ offset: true }).nullable(),
})
export type ProviderUser = z.infer<typeof providerUserSchema>

export const inviteUserSchema = z.object({
  displayName: z.string().trim().min(2, "Enter the person's name"),
  email: z.email("Enter a valid work email"),
  role: freePortalRoleSchema,
})
export type InviteUser = z.infer<typeof inviteUserSchema>

export const NOTIFICATION_KEYS = [
  "newAssignment",
  "observationNeedsResponse",
  "requestMatched",
  "safeguardingUpdate",
  "coordinatorMessage",
  "weeklySummary",
] as const

export const notificationSettingsSchema = z.record(
  z.enum(NOTIFICATION_KEYS),
  z.object({ email: z.boolean(), inApp: z.boolean() }),
)
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

export const organisationSchema = z.object({
  name: z.string(),
  providerRef: z.string(),
  programme: z.string(),
  council: z.string(),
  serviceArea: z.array(z.string()),
  primaryContact: z.string(),
  dataProtectionContact: z.string(),
})
export type Organisation = z.infer<typeof organisationSchema>
