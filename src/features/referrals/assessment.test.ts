import { describe, expect, it } from "vitest"

import { evaluateRules, NOT_KNOWN, notKnownCount, personSchema } from "./assessment"

const kinds = (answers: Record<string, string | string[]>) =>
  evaluateRules(answers).map((r) => `${r.kind}:${r.on}`)

describe("wellbeing assessment rules (form v0.2)", () => {
  it("stops when the person declines (A3 = No)", () => {
    expect(kinds({ A3: "No" })).toContain("stop:A3")
  })

  it("pauses until the person has been given the information", () => {
    expect(kinds({ A1: "No", A3: "Yes" })).toContain("pause:A1")
    expect(kinds({ A3: "Decision pending" })).toContain("pause:A1")
  })

  it("stops on a safeguarding concern, including when unsure (D2)", () => {
    expect(kinds({ D2: "Unsure" })).toContain("stop:D2")
  })

  it("passes visit and care questions to the reviewer instead of stopping", () => {
    const result = kinds({ E1: "Needs regular help", K6_risk: "Yes", D1: "Sometimes" })
    expect(result).toEqual(expect.arrayContaining(["review:E1", "review:K6_risk", "flag:D1"]))
    expect(result.some((r) => r.startsWith("stop"))).toBe(false)
  })

  it("counts Not known answers for follow-up, never as a score", () => {
    expect(notKnownCount({ C2: NOT_KNOWN, K5: ["Smartphone", NOT_KNOWN], D1: "Yes" })).toBe(2)
  })

  it("accepts Bromley postcodes and +44 numbers only", () => {
    const base = {
      fullName: "Diana Carter",
      dateOfBirth: "1946-03-14",
      address: "12 High Street, Orpington",
    }
    expect(
      personSchema.safeParse({ ...base, postcode: "BR6 0LS", telephone: "+44 20 8461 7000" })
        .success,
    ).toBe(true)
    expect(
      personSchema.safeParse({ ...base, postcode: "E6 2AB", telephone: "+44 20 8461 7000" })
        .success,
    ).toBe(false)
    expect(
      personSchema.safeParse({ ...base, postcode: "BR6 0LS", telephone: "020 8461 7000" }).success,
    ).toBe(false)
  })
})
