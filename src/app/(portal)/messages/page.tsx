import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@/components/shared/page-skeleton"
import { MessagesView } from "@/features/messages/components/messages-view"

export const metadata: Metadata = { title: "Messages" }

// Suspense lets URL state (filters, tabs) resolve on the client without blocking the shell.
export default function MessagesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MessagesView />
    </Suspense>
  )
}
