import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { ResidentProfile } from "@/features/residents/components/resident-profile"

export const metadata: Metadata = { title: "Resident" }

// Suspense lets the route params and tab state resolve on the client without blocking the shell.
export default function ResidentPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResidentProfile />
    </Suspense>
  )
}
