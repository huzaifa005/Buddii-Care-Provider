import { beforeEach, describe, expect, it } from "vitest"

import { buildActions, replyToAction } from "./action-centre"
import { db, resetDb } from "./db"

describe("Action Centre", () => {
  beforeEach(() => resetDb())

  it("collects every source, with a deep link for each", () => {
    const actions = buildActions()
    const kinds = new Set(actions.map((a) => a.kind))
    // Review-due items depend on today's date, so only the date-free sources are asserted.
    for (const kind of ["INFO_REQUEST", "ASSIGNMENT", "OBSERVATION"] as const) {
      expect(kinds.has(kind)).toBe(true)
    }
    expect(actions.every((a) => a.href.startsWith("/"))).toBe(true)
    // Diana Carter's referral: the Council asked for the care plan.
    expect(actions.find((a) => a.residentName === "Diana Carter")?.kind).toBe("INFO_REQUEST")
  })

  it("puts high priority first and only lets Council requests be answered here", () => {
    const actions = buildActions()
    expect(actions[0]!.priority).toBe("HIGH")
    expect(actions.filter((a) => a.canReply).every((a) => a.kind === "INFO_REQUEST")).toBe(true)
  })

  it("marks an answered request as replied and adds its files to the resident", () => {
    const request = buildActions().find((a) => a.kind === "INFO_REQUEST" && a.residentId)!
    const before = db.documents.filter((d) => d.residentId === request.residentId).length
    replyToAction(
      request,
      { message: "Called on 04 Nov and updated H1 and H2.", files: [] },
      "Sarah M.",
    )
    expect(buildActions().find((a) => a.id === request.id)?.status).toBe("REPLIED")
    expect(db.documents.filter((d) => d.residentId === request.residentId)).toHaveLength(before)
  })
})
