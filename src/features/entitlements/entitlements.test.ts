import { describe, expect, it } from "vitest"

import { hasEntitlement } from "./entitlements"

describe("hasEntitlement", () => {
  it("grants only what the organisation holds", () => {
    const freeTier = ["BUDDII_PROVIDER_CORE"] as const

    expect(hasEntitlement(freeTier, "BUDDII_PROVIDER_CORE")).toBe(true)
    expect(hasEntitlement(freeTier, "CARE_MANAGEMENT_PRO")).toBe(false)
  })
})
