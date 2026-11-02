import { screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders, signInAs } from "@/test/render"

import { AssignmentsView } from "./assignments-view"

describe("AssignmentsView", () => {
  it("lists assignments awaiting a response", async () => {
    renderWithProviders(<AssignmentsView />)

    expect(await screen.findByText("ASN-2026-051")).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /confirm participation/i })).toHaveLength(3)
  })

  it("confirms participation and removes the assignment from the queue", async () => {
    const { user } = renderWithProviders(<AssignmentsView />)
    const [firstConfirm] = await screen.findAllByRole("button", { name: /confirm participation/i })

    await user.click(firstConfirm!)
    const dialog = await screen.findByRole("dialog", { name: /confirm programme participation/i })
    await user.click(within(dialog).getByRole("button", { name: /confirm participation/i }))

    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: /confirm participation/i })).toHaveLength(2),
    )
    expect(await screen.findByText("Participation confirmed")).toBeInTheDocument()
  })

  it("hides the decision buttons from roles that cannot respond", async () => {
    signInAs("PROVIDER_PRACTITIONER")
    renderWithProviders(<AssignmentsView />)

    expect(await screen.findAllByText(/needs to confirm or decline/i)).toHaveLength(3)
    expect(screen.queryByRole("button", { name: /confirm participation/i })).not.toBeInTheDocument()
  })
})
