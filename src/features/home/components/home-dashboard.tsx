"use client"

import { RefreshCw, TriangleAlert } from "lucide-react"

import { Panel } from "@/components/shared/panel"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

import { useDashboardSummary } from "../api"
import { AttentionList } from "./attention-list"
import { HomeHeader } from "./home-header"
import { HomeStats, HomeStatsSkeleton } from "./home-stats"
import { ObservationAlert } from "./observation-alert"
import { PendingAssignments } from "./pending-assignments"
import { TodayVisits } from "./today-visits"
import { VolunteerHoursChart } from "./volunteer-hours-chart"

export function HomeDashboard() {
  const { data, isPending, isError, refetch, isRefetching } = useDashboardSummary()

  return (
    <div className="space-y-6">
      <HomeHeader />

      {isPending ? (
        <HomeSkeleton />
      ) : isError ? (
        <Panel>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TriangleAlert />
              </EmptyMedia>
              <EmptyTitle>We couldn&apos;t load your dashboard</EmptyTitle>
              <EmptyDescription>Check your connection and try again.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => refetch()} disabled={isRefetching}>
                <RefreshCw className={isRefetching ? "animate-spin" : undefined} aria-hidden />
                Try again
              </Button>
            </EmptyContent>
          </Empty>
        </Panel>
      ) : (
        <>
          <ObservationAlert actions={data.actions} />
          <HomeStats metrics={data.metrics} />
          <div className="grid gap-6 lg:grid-cols-12">
            <AttentionList actions={data.actions} />
            <TodayVisits visits={data.todayVisits} />
          </div>
          <div className="grid gap-6 lg:grid-cols-12">
            <VolunteerHoursChart data={data.volunteerHours} />
            <PendingAssignments assignments={data.pendingAssignments} />
          </div>
        </>
      )}
    </div>
  )
}

function HomeSkeleton() {
  return (
    <>
      <HomeStatsSkeleton />
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-[26rem] rounded-panel lg:col-span-8" />
        <Skeleton className="h-[26rem] rounded-panel lg:col-span-4" />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-80 rounded-panel lg:col-span-8" />
        <Skeleton className="h-80 rounded-panel lg:col-span-4" />
      </div>
    </>
  )
}
