import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, type RenderOptions } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { http, HttpResponse } from "msw/http"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { type ProviderRole } from "@/features/session/schemas"
import { sessionFixture } from "@/mocks/fixtures/session"

import { server } from "./server"

interface Options extends Omit<RenderOptions, "wrapper"> {
  /** Initial query string, e.g. "?status=CONFIRMED". */
  searchParams?: string
}

/** Renders a screen with the app's providers and a fresh query cache. */
export function renderWithProviders(
  ui: React.ReactElement,
  { searchParams, ...options }: Options = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const user = userEvent.setup()
  const result = render(
    <QueryClientProvider client={queryClient}>
      <NuqsTestingAdapter searchParams={searchParams}>
        <TooltipProvider>
          {ui}
          <Toaster />
        </TooltipProvider>
      </NuqsTestingAdapter>
    </QueryClientProvider>,
    options,
  )
  return { ...result, user, queryClient }
}

/** Signs the mock session in as a different provider role for the current test. */
export function signInAs(role: ProviderRole) {
  server.use(
    http.get("http://localhost/api/v1/me", () =>
      HttpResponse.json({ ...sessionFixture, user: { ...sessionFixture.user, role } }),
    ),
  )
}
