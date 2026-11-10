import { type StatusTone } from "@/components/shared/status-pill"

import { type ConsentStatus, type ProgrammeStatus, type VolunteerMatchStatus } from "./schemas"

export const PROGRAMME_STATUS: Record<ProgrammeStatus, { label: string; tone: StatusTone }> = {
  ACTIVE: { label: "Active", tone: "success" },
  PENDING: { label: "Pending", tone: "warning" },
  PAUSED: { label: "Paused", tone: "neutral" },
  CLOSED: { label: "Closed", tone: "neutral" },
  DECEASED: { label: "Deceased", tone: "neutral" },
}

export const MATCH_STATUS: Record<VolunteerMatchStatus, string> = {
  MATCHED: "Volunteer matched",
  AWAITING_MATCH: "Awaiting volunteer",
}

export const CONSENT_STATUS: Record<ConsentStatus, { label: string; tone: StatusTone }> = {
  GIVEN: { label: "Consent given", tone: "success" },
  PENDING: { label: "Consent pending", tone: "warning" },
  WITHDRAWN: { label: "Consent withdrawn", tone: "danger" },
}

/** Locked records: read-only, no new requests, responses or concerns. */
export function isLocked(status: ProgrammeStatus) {
  return status === "DECEASED" || status === "CLOSED"
}

export function latest(series: number[]) {
  return series.length ? series[series.length - 1]! : null
}

/** Two-letter initials for an avatar, e.g. "Margaret Davies" -> "MD". */
export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")).toUpperCase()
}

/** Change between the last two observations: positive means the score went up. */
export function lastChange(series: number[]) {
  if (series.length < 2) return 0
  return series[series.length - 1]! - series[series.length - 2]!
}
