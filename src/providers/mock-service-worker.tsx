"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

import { markApiReady } from "@/lib/api/mock-gate"
import { isApiMockingEnabled } from "@/lib/env"

// `ssr: false` keeps msw/browser (which has no Node build) out of the server bundle, and the
// chunk is only fetched when mocking is enabled.
const MswStarter = dynamic(() => import("./msw-starter"), { ssr: false })

/** Starts MSW in development; API requests wait on `apiReady` until it is intercepting. */
export function MockServiceWorker() {
  if (!isApiMockingEnabled) return null

  return (
    // Browser-only components suspend during prerender; contain that here.
    <Suspense fallback={null}>
      <MswStarter onReady={markApiReady} />
    </Suspense>
  )
}
