import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { NewAssessmentView } from "@/features/resident-records/components/new-assessment-view"

export const metadata: Metadata = { title: "Wellbeing assessment" }

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NewAssessmentView />
    </Suspense>
  )
}
