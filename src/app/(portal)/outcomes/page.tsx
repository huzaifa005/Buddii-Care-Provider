import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { OutcomesView } from "@/features/outcomes/components/outcomes-view"

export const metadata: Metadata = { title: "Outcomes & Impact" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function OutcomesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OutcomesView />
    </Suspense>
  )
}
