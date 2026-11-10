import { type StatusTone } from "@/components/shared/status-pill"

import { type RecordStatus } from "../schemas"

/** Council verification states (Council design system: Received · Verified · Missing). */
export const RECORD_STATUS: Record<RecordStatus, { label: string; tone: StatusTone }> = {
  RECEIVED: { label: "Received", tone: "warning" },
  INFO_REQUESTED: { label: "Info requested", tone: "danger" },
  VERIFIED: { label: "Verified", tone: "success" },
}
