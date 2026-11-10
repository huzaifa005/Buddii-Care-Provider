import { StatusPill, type StatusTone } from "@/components/shared/status-pill"
import { cn } from "@/lib/utils"

/** Outcome measures shared by the Outcomes page and the resident profile (Council 03.5.07). */
export type MeasureKey = "wemwbs" | "ucla" | "visitCheck"

/** The measures as the Council records them (resident profile › Outcome summary, 03.5.07). */
export const MEASURES: Record<
  MeasureKey,
  { area: string; measured: string; max: number; better: "up" | "down" }
> = {
  wemwbs: {
    area: "Overall wellbeing",
    measured: "Warwick-Edinburgh scale (14-70)",
    max: 70,
    better: "up",
  },
  ucla: {
    area: "Loneliness",
    measured: "UCLA 3-item scale (3-9, lower is better)",
    max: 9,
    better: "down",
  },
  visitCheck: {
    area: "Visit check",
    measured: "Volunteer check after each visit (1-5). Not an assessment",
    max: 5,
    better: "up",
  },
}
export const MEASURE_KEYS = Object.keys(MEASURES) as MeasureKey[]

export type Direction = "improved" | "no_change" | "declined" | "awaiting"

export const DIRECTION: Record<Direction, { label: string; tone: StatusTone }> = {
  improved: { label: "Improved", tone: "success" },
  no_change: { label: "No change", tone: "info" },
  declined: { label: "Declined", tone: "danger" },
  awaiting: { label: "Awaiting review", tone: "neutral" },
}

export function direction(
  key: MeasureKey,
  baseline: number | null,
  latest: number | null,
): Direction {
  if (baseline === null || latest === null) return "awaiting"
  const change = latest - baseline
  if (change === 0) return "no_change"
  return (MEASURES[key].better === "up" ? change > 0 : change < 0) ? "improved" : "declined"
}

export const round1 = (n: number) => Math.round(n * 10) / 10
export const signed = (n: number) => `${n > 0 ? "+" : ""}${round1(n)}`

export function ChangePill({
  measure,
  baseline,
  latest,
  compact = false,
}: {
  measure: MeasureKey
  baseline: number
  latest: number
  /** Table cells: just the number; the colour shows the direction. */
  compact?: boolean
}) {
  const dir = direction(measure, baseline, latest)
  const change = latest - baseline
  const better = MEASURES[measure].better === "down" && dir === "improved" ? " better" : ""
  return (
    <StatusPill tone={DIRECTION[dir].tone} className={cn(compact && "px-1.5")}>
      {change === 0 ? (compact ? "0" : "No change") : `${signed(change)}${compact ? "" : better}`}
      <span className="sr-only"> {DIRECTION[dir].label}</span>
    </StatusPill>
  )
}

/** "42 → 51 (+9)" on one line; a dash until there is a baseline. */
export function ScorePair({
  measure,
  pair,
}: {
  measure: MeasureKey
  pair: { baseline: number | null; latest: number | null }
}) {
  if (pair.baseline === null) return <span className="text-muted-foreground">—</span>
  if (pair.latest === null)
    return (
      <span className="whitespace-nowrap tabular-nums">
        {pair.baseline} <span className="text-xs text-muted-foreground">· review due</span>
      </span>
    )
  return (
    <span className="flex items-center gap-2 whitespace-nowrap tabular-nums">
      <span className="text-muted-foreground">{pair.baseline}</span>
      <span aria-hidden className="text-muted-foreground">
        →
      </span>
      <span className="font-semibold text-heading">{pair.latest}</span>
      <ChangePill measure={measure} baseline={pair.baseline} latest={pair.latest} compact />
    </span>
  )
}
