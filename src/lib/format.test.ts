import { describe, expect, it } from "vitest"

import { formatDayMonth, formatTime, initials, isToday } from "./format"

describe("format", () => {
  it("shows datetimes in UK time regardless of the device time zone", () => {
    // 10:30 BST, sent with a UTC offset.
    expect(formatTime("2026-10-19T09:30:00Z")).toBe("10:30")
    // Crosses midnight in UTC but not in the UK.
    expect(formatDayMonth("2026-07-05T23:30:00Z")).toBe("6 Jul")
  })

  it("leaves date-only values untouched", () => {
    expect(formatDayMonth("2026-10-21")).toBe("21 Oct")
  })

  it("treats today as the UK calendar day", () => {
    // 00:30 in London on 20 Oct is still 19 Oct in UTC.
    expect(isToday("2026-10-20", new Date("2026-10-19T23:30:00Z"))).toBe(true)
  })

  it("builds initials", () => {
    expect(initials("River Garden Care")).toBe("RG")
  })
})
