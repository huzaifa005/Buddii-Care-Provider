import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { ReferResidentForm } from "@/features/referrals/components/refer-resident-form"

export const metadata: Metadata = { title: "Refer a resident" }

export default function ReferResidentPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReferResidentForm />
    </Suspense>
  )
}
