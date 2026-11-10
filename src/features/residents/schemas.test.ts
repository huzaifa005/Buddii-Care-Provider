import { describe, expect, it } from "vitest"

import { residentsFixture } from "@/mocks/fixtures/residents"

import { residentSchema } from "./schemas"

describe("residentSchema", () => {
  const resident = residentsFixture[0]!

  it("accepts a valid provider-visible resident", () => {
    expect(residentSchema.parse(resident)).toEqual(resident)
  })

  it("strips restricted data if the API ever over-shares", () => {
    const leaked = {
      ...resident,
      medication: ["Donepezil 10mg"],
      dnrStatus: "DNACPR",
      keysafeCode: "1234",
      diagnosis: "Dementia",
      fullName: "Jane Doe",
    }

    const parsed = residentSchema.parse(leaked)

    for (const key of ["medication", "dnrStatus", "keysafeCode", "diagnosis", "fullName"]) {
      expect(parsed).not.toHaveProperty(key)
    }
  })

  it("rejects ids that are not Buddii IDs", () => {
    expect(() => residentSchema.parse({ ...resident, id: "Jane Doe" })).toThrow()
  })

  it("rejects outcome scores outside 1-5", () => {
    expect(() => residentSchema.parse({ ...resident, visitCheckHistory: [6] })).toThrow()
  })
})
