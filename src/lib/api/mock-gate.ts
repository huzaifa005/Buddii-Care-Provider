import { isApiMockingEnabled } from "@/lib/env"

let resolveReady: (() => void) | undefined

/**
 * Requests wait on this before hitting the network. With mocking enabled it resolves once the
 * MSW worker is intercepting; otherwise it is already resolved and costs nothing.
 * Gating the network (not the UI) lets the shell prerender normally in every mode.
 */
export const apiReady: Promise<void> =
  isApiMockingEnabled && typeof window !== "undefined"
    ? new Promise((resolve) => {
        resolveReady = resolve
      })
    : Promise.resolve()

export function markApiReady() {
  resolveReady?.()
}
