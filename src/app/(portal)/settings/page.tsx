import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { SettingsView } from "@/features/settings/components/settings-view"

export const metadata: Metadata = { title: "Users & Settings" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SettingsView />
    </Suspense>
  )
}
