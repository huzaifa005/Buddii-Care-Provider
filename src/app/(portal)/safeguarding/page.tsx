import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { SafeguardingView } from "@/features/safeguarding/components/safeguarding-view"

export const metadata: Metadata = { title: "Safeguarding" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function SafeguardingPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SafeguardingView />
    </Suspense>
  )
}
