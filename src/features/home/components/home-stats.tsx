"use client"

import { deltaFrom, StatCard, StatCardSkeleton } from "@/components/shared/stat-card"
import { useOutcomeAssessments } from "@/features/outcomes/api"
import { signed } from "@/features/outcomes/components/outcome-measures"
import { formatNumber } from "@/lib/format"
import { KpiIcons } from "@/lib/icons"

import { type DashboardSummary } from "../schemas"

const GRID = "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"

export function HomeStats({ metrics }: { metrics: DashboardSummary["metrics"] }) {
  const { activeResidents, volunteerHoursThisMonth, visitsCompletedThisMonth } = metrics
  const wellbeing = useWellbeingChange()

  return (
    <div className={`${GRID}`}>
      <StatCard
        label="Active residents"
        featured
        value={formatNumber(activeResidents.current)}
        icon={KpiIcons.people}
        caption="in the programme"
        href="/residents"
      />
      <StatCard
        label="Volunteer hours"
        value={formatNumber(volunteerHoursThisMonth.current)}
        icon={KpiIcons.hours}
        delta={deltaFrom(volunteerHoursThisMonth.current, volunteerHoursThisMonth.previous)}
        caption="this month"
        href="/volunteer-activity"
      />
      <StatCard
        label="Visits completed"
        value={formatNumber(visitsCompletedThisMonth.current)}
        icon={KpiIcons.volunteer}
        caption={`of ${visitsCompletedThisMonth.scheduled} scheduled this month`}
        href="/volunteer-activity"
      />
      <StatCard
        label="Wellbeing change"
        value={wellbeing ? signed(wellbeing.change) : "N/A"}
        icon={KpiIcons.wellbeing}
        caption={
          wellbeing
            ? `WEMWBS average · ${wellbeing.count} verified reviews`
            : "no verified reviews yet"
        }
        href="/outcomes"
      />
    </div>
  )
}

export function HomeStatsSkeleton() {
  return (
    <div className={GRID}>
      {Array.from({ length: 4 }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  )
}

/** Average WEMWBS change (baseline to latest) across residents with a verified review. */
function useWellbeingChange() {
  const { data } = useOutcomeAssessments()
  const paired = (data?.residents ?? []).filter(
    (r) => r.wemwbs.baseline !== null && r.wemwbs.latest !== null,
  )
  if (paired.length === 0) return null
  const change =
    paired.reduce((sum, r) => sum + (r.wemwbs.latest! - r.wemwbs.baseline!), 0) / paired.length
  return { change, count: paired.length }
}
