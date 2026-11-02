import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { AssignmentsView } from "@/features/assignments/components/assignments-view"

export const metadata: Metadata = { title: "New Assignments" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function AssignmentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AssignmentsView />
    </Suspense>
  )
}
