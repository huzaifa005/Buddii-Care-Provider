import { screen } from "@testing-library/react"
import { http, HttpResponse } from "msw/http"
import { describe, expect, it } from "vitest"

import { renderWithProviders } from "@/test/render"
import { server } from "@/test/server"

import { HomeDashboard } from "./home-dashboard"

describe("HomeDashboard", () => {
  it("shows the KPIs, the action list and today's visits", async () => {
    renderWithProviders(<HomeDashboard />)

    expect(await screen.findByText("Active residents")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Volunteer hours" })).toBeInTheDocument()
    expect(screen.getByText("Respond to a volunteer observation")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Today's visits" })).toBeInTheDocument()
  })

  it("flags observations that need a response in an amber banner", async () => {
    renderWithProviders(<HomeDashboard />)

    expect(
      await screen.findByRole("link", { name: /1 volunteer observation needs your response/i }),
    ).toHaveAttribute("href", "/volunteer-activity?filter=needs_response")
  })

  it("offers a retry when the dashboard fails to load", async () => {
    server.use(
      http.get("http://localhost/api/v1/dashboard/summary", () =>
        HttpResponse.json({ detail: "Server error" }, { status: 500 }),
      ),
    )
    renderWithProviders(<HomeDashboard />)

    expect(await screen.findByText("We couldn't load your dashboard")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
  })
})
