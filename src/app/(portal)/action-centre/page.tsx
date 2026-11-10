import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { ActionCentreView } from "@/features/action-centre/components/action-centre-view"

export const metadata: Metadata = { title: "Action Centre" }

// Suspense lets URL state (filters, open action) resolve on the client without blocking the shell.
export default function ActionCentrePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ActionCentreView />
    </Suspense>
  )
}
