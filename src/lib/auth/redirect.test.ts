import { describe, expect, it } from "vitest"

import { loginPath, safeRedirectPath } from "./redirect"

describe("safeRedirectPath", () => {
  it.each([
    ["/residents/BUD-0009?tab=outcomes", "/residents/BUD-0009?tab=outcomes"],
    ["/support-requests#new", "/support-requests#new"],
  ])("keeps same-origin path %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected)
  })

  it.each([
    "https://evil.example",
    "//evil.example/phish",
    "/\\evil.example",
    "javascript:alert(1)",
    "residents",
    "/login?next=/login",
    "",
    null,
    undefined,
  ])("falls back to / for unsafe target %s", (input) => {
    expect(safeRedirectPath(input)).toBe("/")
  })
})

describe("loginPath", () => {
  it("carries a safe return path", () => {
    expect(loginPath("/messages?thread=T-003")).toBe("/login?next=%2Fmessages%3Fthread%3DT-003")
  })

  it("drops unsafe return paths", () => {
    expect(loginPath("https://evil.example")).toBe("/login")
  })
})
