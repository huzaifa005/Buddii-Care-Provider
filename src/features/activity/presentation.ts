import { type StatusTone } from "@/components/shared/status-pill"

import { type ActivityStatus } from "./schemas"

export const ACTIVITY_STATUS: Record<ActivityStatus, { label: string; tone: StatusTone }> = {
  COMPLETED: { label: "Completed", tone: "success" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  SCHEDULED: { label: "Scheduled", tone: "neutral" },
  MISSED: { label: "Missed", tone: "danger" },
}
