import { screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { sessionKeys } from "@/features/session/api"
import { renderWithProviders } from "@/test/render"
import { router } from "@/test/router"

import { ResidentProfile } from "./resident-profile"

const params = vi.hoisted(() => ({ residentId: "BUD-0009" }))

vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => `/residents/${params.residentId}`,
  useParams: () => params,
  useSearchParams: () => new URLSearchParams(),
}))

describe("ResidentProfile", () => {
  it("shows the resident with a breadcrumb, seven numbered tabs and a More menu", async () => {
    params.residentId = "BUD-0009"
    renderWithProviders(<ResidentProfile />)

    expect(
      await screen.findByRole("heading", { level: 1, name: "Margaret Davies" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Residents" })).toHaveAttribute("href", "/residents")
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "1. Overview",
      "2. Support plan",
      "3. Volunteer activity",
      "4. Outcomes",
      "5. Assessments",
      "6. Documents",
      "7. Observations",
    ])
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Outcome summary" })).toBeInTheDocument()
    expect(await screen.findByRole("link", { name: /support request/i })).toHaveAttribute(
      "href",
      "/support-requests?new=true&for=BUD-0009",
    )
  })

  it("locks a deceased resident's record", async () => {
    params.residentId = "BUD-0027"
    const { queryClient } = renderWithProviders(<ResidentProfile />)

    expect(await screen.findByText("This record is closed and read-only.")).toBeInTheDocument()
    // Actions depend on the session, so wait for it before checking they are hidden.
    await waitFor(() => expect(queryClient.getQueryData(sessionKeys.all)).toBeDefined())
    expect(screen.queryByRole("link", { name: /support request/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /report concern/i })).not.toBeInTheDocument()
  })

  it("explains when the resident does not exist", async () => {
    params.residentId = "BUD-9999"
    renderWithProviders(<ResidentProfile />)

    expect(await screen.findByText("Resident not found")).toBeInTheDocument()
  })
})
