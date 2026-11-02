"use client"

import { deltaFrom, StatCard, StatCardSkeleton } from "@/components/shared/stat-card"
import { formatNumber } from "@/lib/format"
import { KpiIcons } from "@/lib/icons"

import { type DashboardSummary } from "../schemas"

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"

export function HomeStats({ metrics }: { metrics: DashboardSummary["metrics"] }) {
  const { activeClients, volunteerHoursThisMonth, visitsCompletedThisMonth, averageWellbeing } =
    metrics
  const completion =
    visitsCompletedThisMonth.scheduled > 0
      ? Math.round((visitsCompletedThisMonth.current / visitsCompletedThisMonth.scheduled) * 100)
      : 0

  return (
    <div className={`${GRID}`}>
      <StatCard
        label="Active residents"
        featured
        value={formatNumber(activeClients.current)}
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
        href="/outcomes"
      />
      <StatCard
        label="Visits completed"
        value={formatNumber(visitsCompletedThisMonth.current)}
        icon={KpiIcons.volunteer}
        caption={`${completion}% of ${visitsCompletedThisMonth.scheduled} scheduled`}
        href="/volunteer-activity"
      />
      <StatCard
        label="Average wellbeing"
        value={
          <>
            {averageWellbeing.current.toFixed(1)}
            <span className="ml-1 text-base font-normal text-muted-foreground">/ 5</span>
          </>
        }
        icon={KpiIcons.wellbeing}
        delta={deltaFrom(averageWellbeing.current, averageWellbeing.previous, {
          format: (n) => n.toFixed(1),
        })}
        caption="vs last month"
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
