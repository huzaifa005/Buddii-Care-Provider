import { screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/render"

import { ReferResidentForm } from "./refer-resident-form"

describe("ReferResidentForm", () => {
  it("keeps every section locked until consent and privacy (A1 to A4) are answered", async () => {
    renderWithProviders(<ReferResidentForm />)

    expect(await screen.findAllByText(/answer a1 to a4 first/i)).not.toHaveLength(0)
  })

  it("stops the assessment when the person declines", async () => {
    const { user } = renderWithProviders(<ReferResidentForm />)

    const a3 = await screen.findByRole("group", { name: /a3\. does the person agree/i })
    await user.click(within(a3).getByRole("radio", { name: "No" }))

    expect(await screen.findAllByText(/the person declined/i)).not.toHaveLength(0)
  })

  it("does not send an incomplete form", async () => {
    const { user } = renderWithProviders(<ReferResidentForm />)

    await user.click(await screen.findByRole("button", { name: /send to council/i }))

    expect(await screen.findByText("Check the form")).toBeInTheDocument()
  })
})
