import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { OutcomesViewV2 } from "@/features/outcomes/components/outcomes-view-v2"

export const metadata: Metadata = { title: "Outcomes" }

// v2 follows the Council Outcomes layout. The original view stays at /outcomes/v1.
export default function OutcomesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OutcomesViewV2 />
    </Suspense>
  )
}
