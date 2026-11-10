import { describe, expect, it } from "vitest"

import { newSupportRequestSchema } from "./schemas"

const valid = {
  residentId: "BUD-0009",
  type: "Companionship visit",
  goal: "Reduce isolation through weekly visits",
  frequency: "WEEKLY",
  preferredTime: "EITHER",
  context: "",
  riskLevel: "STANDARD",
  consentConfirmed: true,
} as const

describe("newSupportRequestSchema", () => {
  it("accepts a complete, consented request", () => {
    expect(newSupportRequestSchema.safeParse(valid).success).toBe(true)
  })

  it("rejects an unselected support type with a friendly message", () => {
    const result = newSupportRequestSchema.safeParse({ ...valid, type: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe("Choose the type of support")
  })

  it("requires consent before submitting", () => {
    const result = newSupportRequestSchema.safeParse({ ...valid, consentConfirmed: false })
    expect(result.error?.issues[0]?.message).toBe("Consent must be confirmed before submitting")
  })

  it("only allows volunteer-safe support types", () => {
    expect(newSupportRequestSchema.safeParse({ ...valid, type: "Medication prompt" }).success).toBe(
      false,
    )
  })
})
