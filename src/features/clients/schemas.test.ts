import { describe, expect, it } from "vitest"

import { clientsFixture } from "@/mocks/fixtures/clients"

import { clientSchema } from "./schemas"

describe("clientSchema", () => {
  const client = clientsFixture[0]!

  it("accepts a valid provider-visible client", () => {
    expect(clientSchema.parse(client)).toEqual(client)
  })

  it("strips restricted data if the API ever over-shares", () => {
    const leaked = {
      ...client,
      medication: ["Donepezil 10mg"],
      dnrStatus: "DNACPR",
      keysafeCode: "1234",
      diagnosis: "Dementia",
      fullName: "Jane Doe",
    }

    const parsed = clientSchema.parse(leaked)

    for (const key of ["medication", "dnrStatus", "keysafeCode", "diagnosis", "fullName"]) {
      expect(parsed).not.toHaveProperty(key)
    }
  })

  it("rejects ids that are not Buddii IDs", () => {
    expect(() => clientSchema.parse({ ...client, id: "Jane Doe" })).toThrow()
  })

  it("rejects outcome scores outside 1-5", () => {
    expect(() => clientSchema.parse({ ...client, wellbeingHistory: [6] })).toThrow()
  })
})
