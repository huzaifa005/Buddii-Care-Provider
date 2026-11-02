import { screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MOCK_PASSWORD } from "@/mocks/handlers"
import { renderWithProviders } from "@/test/render"
import { router } from "@/test/router"

import { LoginForm } from "./login-form"

async function signIn(password: string) {
  const { user } = renderWithProviders(<LoginForm />)
  await user.type(screen.getByLabelText(/work email/i), "sarah.m@rivergarden.example")
  await user.type(screen.getByLabelText(/^password$/i), password)
  await user.click(screen.getByRole("button", { name: /sign in/i }))
}

describe("LoginForm", () => {
  it("shows one generic message for wrong credentials", async () => {
    await signIn("wrong-password")

    expect(await screen.findByRole("alert")).toHaveTextContent("Email or password is incorrect.")
    expect(router.replace).not.toHaveBeenCalled()
  })

  it("signs in and returns to the home page", async () => {
    await signIn(MOCK_PASSWORD)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"))
  })

  it("validates the email before calling the API", async () => {
    const { user } = renderWithProviders(<LoginForm />)
    await user.click(screen.getByRole("button", { name: /sign in/i }))

    expect(await screen.findByText("Enter your work email address")).toBeInTheDocument()
  })
})
