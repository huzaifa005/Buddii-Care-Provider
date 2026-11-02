import { describe, expect, it } from "vitest"

import { CAPABILITIES, can, ROLE_CAPABILITIES } from "./permissions"
import { FREE_PORTAL_ROLES, PROVIDER_ROLES } from "./schemas"

describe("role permissions", () => {
  it("gives administrators every capability", () => {
    for (const capability of CAPABILITIES)
      expect(can("PROVIDER_ADMINISTRATOR", capability)).toBe(true)
  })

  it("restricts user management to administrators", () => {
    const managers = PROVIDER_ROLES.filter((role) => can(role, "users.manage"))
    expect(managers).toEqual(["PROVIDER_ADMINISTRATOR"])
  })

  it("lets every role that works with clients raise a safeguarding concern", () => {
    for (const role of PROVIDER_ROLES.filter((r) => r !== "PROVIDER_REPORTING_USER")) {
      expect(can(role, "safeguarding.report")).toBe(true)
    }
  })

  it("only offers the four free portal roles when inviting", () => {
    expect(FREE_PORTAL_ROLES).not.toContain("CARE_OPERATIONS_USER")
    expect(FREE_PORTAL_ROLES).toHaveLength(4)
  })

  it("lets reporting users see referrals but not send them", () => {
    expect(can("PROVIDER_REPORTING_USER", "referrals.create")).toBe(false)
    expect(can("PROVIDER_COORDINATOR", "referrals.create")).toBe(true)
  })

  it("keeps reporting users read-only apart from reports", () => {
    expect(ROLE_CAPABILITIES.PROVIDER_REPORTING_USER).toEqual(["reports.generate"])
  })
})
