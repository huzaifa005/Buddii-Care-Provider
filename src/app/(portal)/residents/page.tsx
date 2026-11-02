import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { ResidentsView } from "@/features/clients/components/residents-view"

export const metadata: Metadata = { title: "Residents" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function ResidentsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResidentsView />
    </Suspense>
  )
}
