import { expect, test, waitForPage } from "./fixtures"

test("mobile: navigation drawer opens and the page has no horizontal scroll", async ({ page }) => {
  await page.goto("/")
  await waitForPage(page, /good (morning|afternoon|evening)/i)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)

  await page.getByRole("button", { name: /toggle sidebar/i }).click()
  await page.getByRole("link", { name: "Residents" }).click()
  await waitForPage(page, /^residents$/i)
})
