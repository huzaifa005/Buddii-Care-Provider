import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { SupportRequestsView } from "@/features/support-requests/components/support-requests-view"

export const metadata: Metadata = { title: "Support Requests" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function SupportRequestsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SupportRequestsView />
    </Suspense>
  )
}
