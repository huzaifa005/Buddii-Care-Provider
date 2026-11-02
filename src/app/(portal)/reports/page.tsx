import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { ReportsView } from "@/features/reports/components/reports-view"

export const metadata: Metadata = { title: "Reports" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function ReportsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReportsView />
    </Suspense>
  )
}
