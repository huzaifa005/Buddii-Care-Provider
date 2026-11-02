import { type StatusTone } from "@/components/shared/status-pill"

import { type RequestStatus, type SupportRequest } from "./schemas"

export const REQUEST_STATUS: Record<
  RequestStatus,
  { label: string; tone: StatusTone; hint: string }
> = {
  COORDINATOR_REVIEW: {
    label: "Awaiting coordinator",
    tone: "warning",
    hint: "Being reviewed by the Volunteer Coordinator",
  },
  MATCHING: { label: "Matching", tone: "info", hint: "Coordinator is finding a volunteer" },
  ACTIVE: { label: "Active", tone: "success", hint: "Volunteer matched and visiting" },
  COMPLETED: { label: "Completed", tone: "neutral", hint: "Support goal reached or ended" },
  CANCELLED: { label: "Cancelled", tone: "neutral", hint: "Withdrawn by the provider" },
}

export const FREQUENCY_LABEL: Record<SupportRequest["frequency"], string> = {
  WEEKLY: "Weekly",
  FORTNIGHTLY: "Fortnightly",
  ONE_OFF: "One-off",
}

export const TIME_LABEL: Record<SupportRequest["preferredTime"], string> = {
  MORNING: "Morning (8–12)",
  AFTERNOON: "Afternoon (12–5)",
  EITHER: "Either",
}
