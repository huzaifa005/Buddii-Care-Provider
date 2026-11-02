import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { ActivityView } from "@/features/activity/components/activity-view"

export const metadata: Metadata = { title: "Volunteer Activity" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function ActivityPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ActivityView />
    </Suspense>
  )
}
