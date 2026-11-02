import { type StatusTone } from "@/components/shared/status-pill"

import { type ActionItem, type ActionPriority, type VisitStatus } from "./schemas"

/** Maps API enums to display copy and tones, so components stay declarative. */

export const PRIORITY_DISPLAY: Record<ActionPriority, { label: string; tone: StatusTone }> = {
  HIGH: { label: "High priority", tone: "danger" },
  MEDIUM: { label: "Medium", tone: "warning" },
  LOW: { label: "Low", tone: "neutral" },
}

export const CTA_LABEL: Record<ActionItem["cta"], string> = {
  REVIEW: "Review",
  RESPOND: "Respond",
  CONFIRM: "Confirm",
  REPLY: "Reply",
  OPEN: "Open",
}

export const VISIT_STATUS_DISPLAY: Record<VisitStatus, { label: string; tone: StatusTone }> = {
  COMPLETED: { label: "Completed", tone: "success" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  SCHEDULED: { label: "Scheduled", tone: "neutral" },
  MISSED: { label: "Missed", tone: "danger" },
}
