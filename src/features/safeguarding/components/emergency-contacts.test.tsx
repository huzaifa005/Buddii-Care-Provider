import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/render"

import { EmergencyButton } from "./emergency-contacts"

describe("EmergencyButton", () => {
  it("opens the emergency numbers with a link to report a concern", async () => {
    const { user } = renderWithProviders(<EmergencyButton />)

    await user.click(screen.getByRole("button", { name: "Emergency contacts" }))
    const dialog = await screen.findByRole("dialog", { name: /emergency contacts/i })

    for (const number of ["999", "+44 20 7946 0123", "111"]) {
      expect(within(dialog).getByText(number)).toBeInTheDocument()
    }
    expect(
      await within(dialog).findByRole("link", { name: /report a safeguarding concern/i }),
    ).toHaveAttribute("href", "/safeguarding?report=true")
  })
})
