"use client"

import { CheckCircle2, HandHeart } from "lucide-react"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { useState } from "react"

import { FilterTabs } from "@/components/shared/filter-tabs"
import { PageHeader } from "@/components/shared/page-header"
import { Panel } from "@/components/shared/panel"
import { EmptyState, QueryBoundary } from "@/components/shared/query-boundary"
import { StatCard, StatCardSkeleton } from "@/components/shared/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCan } from "@/features/session/api"
import { KpiIcons } from "@/lib/icons"

import { useActivity } from "../api"
import { ACTIVITY_FILTERS, type ActivityRecord } from "../schemas"
import { ActivityItem } from "./activity-item"
import { RecordResponseDialog } from "./record-response-dialog"

const FILTER_LABEL: Record<(typeof ACTIVITY_FILTERS)[number], string> = {
  all: "All",
  today: "Today",
  upcoming: "Upcoming",
  needs_response: "Needs response",
  missed: "Missed",
}

export function ActivityView() {
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsStringLiteral(ACTIVITY_FILTERS).withDefault("all"),
  )
  const query = useActivity(filter)
  const [responding, setResponding] = useState<ActivityRecord | null>(null)
  const stats = query.data?.stats
  const canRespond = useCan("activity.respond")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Volunteer Activity"
        description="Every volunteer visit for your residents, with observations to review"
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats ? (
          <>
            <StatCard
              label="Visits completed"
              value={stats.completedThisMonth}
              icon={CheckCircle2}
              caption="this month"
              href="/volunteer-activity"
            />
            <StatCard
              label="Volunteer hours"
              value={stats.hoursThisMonth}
              icon={KpiIcons.hours}
              caption="this month"
              href="/reports"
            />
            <StatCard
              label="Upcoming visits"
              value={stats.upcomingSevenDays}
              icon={KpiIcons.visits}
              caption="scheduled from today"
              href="/volunteer-activity?filter=upcoming"
            />
            <StatCard
              label="Awaiting your response"
              value={stats.awaitingResponse}
              icon={KpiIcons.attention}
              caption="observations"
              href="/volunteer-activity?filter=needs_response"
              attention={stats.awaitingResponse > 0 ? "Action required" : undefined}
            />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>

      <FilterTabs
        label="Filter activity"
        value={filter}
        onChange={(v) => setFilter(v === "all" ? null : v)}
        options={ACTIVITY_FILTERS.map((f) => ({
          value: f,
          label: FILTER_LABEL[f],
          count: query.data?.counts[f],
        }))}
      />

      <Panel className="overflow-hidden p-0">
        <QueryBoundary query={query} fallback={<Skeleton className="m-6 h-72" />}>
          {(data) =>
            data.results.length === 0 ? (
              <EmptyState icon={HandHeart} title="No activity for this filter" />
            ) : (
              <div className="divide-y">
                {data.results.map((record) => (
                  <ActivityItem
                    key={record.id}
                    record={record}
                    onRespond={canRespond ? setResponding : undefined}
                  />
                ))}
              </div>
            )
          }
        </QueryBoundary>
      </Panel>

      <RecordResponseDialog
        record={responding}
        onOpenChange={(open) => !open && setResponding(null)}
      />
    </div>
  )
}
