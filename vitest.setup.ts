import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterAll, afterEach, beforeAll, vi } from "vitest"

import { resetDb } from "@/mocks/db"
import { server } from "@/test/server"

// Browser APIs that jsdom does not implement but our components (Radix, Recharts) use.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Element.prototype.scrollIntoView ??= () => {}
Element.prototype.scrollTo ??= () => {}
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}

// next/navigation needs the App Router context; tests assert on the router spy instead.
vi.mock("next/navigation", async () => {
  const { router } = await import("@/test/router")
  return {
    useRouter: () => router,
    usePathname: () => "/",
    useParams: () => ({}),
    useSearchParams: () => new URLSearchParams(),
  }
})

beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetDb()
  sessionStorage.clear()
  vi.clearAllMocks()
})
afterAll(() => server.close())
