import { describe, expect, it } from "vitest"

import { findActiveNavItem, PORTAL_NAV } from "./navigation"

describe("portal navigation", () => {
  it("uses the Council Dashboard terms, in order", () => {
    expect(PORTAL_NAV.map((item) => item.title)).toEqual([
      "Overview",
      "Residents",
      "Action Centre",
      "Support Requests",
      "Volunteer Activity",
      "Outcomes",
      "Messages",
      "Safeguarding",
      "Reports",
      "Settings",
    ])
  })

  it.each([
    ["/", "home"],
    ["/residents", "residents"],
    ["/residents/BUD-0009", "residents"],
    ["/support-requests/SR-2026-001", "support-requests"],
  ])("highlights %s as %s", (pathname, id) => {
    expect(findActiveNavItem(pathname)?.id).toBe(id)
  })

  it("highlights nothing for unknown routes", () => {
    expect(findActiveNavItem("/live-monitoring")).toBeUndefined()
  })
})
