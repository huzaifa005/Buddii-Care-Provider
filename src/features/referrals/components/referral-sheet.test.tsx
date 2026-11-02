import { screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/render"

import { ReferralSheet } from "./referral-sheet"

describe("ReferralSheet", () => {
  it("warns staff not to enter names or clinical details", async () => {
    renderWithProviders(<ReferralSheet open onOpenChange={() => {}} />)

    expect(await screen.findByText(/address, date of birth, medication/i)).toBeInTheDocument()
  })

  it("explains every missing field instead of submitting", async () => {
    const onOpenChange = vi.fn()
    const { user } = renderWithProviders(<ReferralSheet open onOpenChange={onOpenChange} />)

    await user.click(await screen.findByRole("button", { name: /send to council/i }))

    expect(await screen.findByText("Enter your internal reference")).toBeInTheDocument()
    expect(screen.getByText("Choose an age band")).toBeInTheDocument()
    expect(screen.getByText("Choose at least one type of support")).toBeInTheDocument()
    expect(screen.getByText("The resident must agree before you refer them")).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("rejects a full postcode", async () => {
    const { user } = renderWithProviders(<ReferralSheet open onOpenChange={() => {}} />)

    await user.type(await screen.findByLabelText("Postcode district"), "E6 2AB")
    await user.click(screen.getByRole("button", { name: /send to council/i }))

    expect(
      await screen.findByText("Enter the first part of the postcode only, e.g. E6"),
    ).toBeInTheDocument()
  })

  it("sends a complete referral to the council", async () => {
    const onOpenChange = vi.fn()
    const { user } = renderWithProviders(<ReferralSheet open onOpenChange={onOpenChange} />)

    await user.type(await screen.findByLabelText("Your reference"), "NCH-5001")
    await user.click(screen.getByRole("combobox", { name: "Age band" }))
    await user.click(await screen.findByRole("option", { name: "80-84" }))
    await user.type(screen.getByLabelText("Postcode district"), "e6")
    await user.click(screen.getByRole("checkbox", { name: "Companionship visit" }))
    await user.type(
      screen.getByLabelText("Why volunteer support would help"),
      "Lives alone and would like regular company.",
    )
    await user.click(screen.getByRole("checkbox", { name: /agreed to be referred/i }))
    await user.click(screen.getByRole("button", { name: /send to council/i }))

    expect(await screen.findByText("Referral sent to the council")).toBeInTheDocument()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  }, 20_000) // Many typed fields; slow under a full parallel run.
})
