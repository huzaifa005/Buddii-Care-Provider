import { expect, expectAccessible, test, waitForPage } from "./fixtures"

const ROUTES: [path: string, heading: RegExp][] = [
  ["/", /good (morning|afternoon|evening)/i],
  ["/residents", /^residents$/i],
  ["/residents/BUD-0033", /^Joan Whitfield$/],
  ["/assignments", /new assignments/i],
  ["/support-requests", /support requests/i],
  ["/volunteer-activity", /volunteer activity/i],
  ["/outcomes", /^outcomes$/i],
  ["/messages", /messages/i],
  ["/safeguarding", /safeguarding/i],
  ["/reports", /reports/i],
  ["/settings", /^settings$/i],
  ["/action-centre", /^action centre$/i],
]

for (const [path, heading] of ROUTES) {
  test(`${path} renders without errors and passes accessibility checks`, async ({
    page,
    consoleErrors,
  }) => {
    await page.goto(path)
    await waitForPage(page, heading)
    await expectAccessible(page)
    expect(consoleErrors).toEqual([])
  })
}

test("security headers are sent", async ({ request }) => {
  const response = await request.get("/login")
  const headers = response.headers()
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'")
  expect(headers["x-frame-options"]).toBe("DENY")
  expect(headers["x-content-type-options"]).toBe("nosniff")
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  expect(headers["x-powered-by"]).toBeUndefined()
})

test("unknown routes show the not-found page", async ({ page }) => {
  await page.goto("/does-not-exist")
  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible()
})
