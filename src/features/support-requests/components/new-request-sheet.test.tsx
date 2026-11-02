import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/render"

import { NewRequestSheet } from "./new-request-sheet"

describe("NewRequestSheet", () => {
  it("explains every missing field instead of submitting", async () => {
    const onOpenChange = vi.fn()
    const { user } = renderWithProviders(<NewRequestSheet open onOpenChange={onOpenChange} />)

    await user.click(await screen.findByRole("button", { name: /submit to coordinator/i }))

    expect(await screen.findByText("Choose a resident")).toBeInTheDocument()
    expect(screen.getByText("Choose the type of support")).toBeInTheDocument()
    expect(screen.getByText("Describe the goal in a sentence")).toBeInTheDocument()
    expect(screen.getByText("Consent must be confirmed before submitting")).toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("reminds staff that clinical tasks are out of scope", async () => {
    renderWithProviders(<NewRequestSheet open onOpenChange={() => {}} />)

    expect(
      await screen.findByText(/personal care, medication and clinical tasks are out of scope/i),
    ).toBeInTheDocument()
  })
})
