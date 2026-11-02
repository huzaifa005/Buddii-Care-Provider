"use client"

import { useEffect } from "react"

import { worker } from "@/mocks/browser"

// Module-level so React Strict Mode's double effect does not register the worker twice.
let started: Promise<unknown> | undefined

export default function MswStarter({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    started ??= worker.start({ onUnhandledFrame: "bypass", quiet: true }).catch((error) => {
      // Service workers need localhost or HTTPS, and some browsers block them. Requests then
      // go to the dev server's mock route (src/app/api/v1/[...path]), so the app still works.
      console.warn("Mock service worker unavailable; using the dev server mock API.", error)
    })
    void started.then(onReady)
  }, [onReady])

  return null
}
