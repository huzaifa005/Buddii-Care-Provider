import AxeBuilder from "@axe-core/playwright"
import { test as base, expect, type Page } from "@playwright/test"

/** Console noise that is not an app error (dev tooling, browser extensions). */
const IGNORED_CONSOLE = [/Download the React DevTools/, /\[HMR\]/, /\[Fast Refresh\]/]

export const test = base.extend<{ consoleErrors: string[] }>({
  // Playwright passes the fixture setter positionally; named `provide` so React lint ignores it.
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error" && !IGNORED_CONSOLE.some((re) => re.test(msg.text()))) {
        errors.push(msg.text())
      }
    })
    page.on("pageerror", (error) => errors.push(error.message))
    await provide(errors)
  },
})

export { expect }

/** Waits until the page has its data: the page heading is visible and no skeletons remain. */
export async function waitForPage(page: Page, heading: string | RegExp) {
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible()
  await expect(page.locator('[data-slot="skeleton"]:visible')).toHaveCount(0)
}

/** WCAG 2.1 A/AA scan; fails on serious or critical violations only, listing the offenders. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    // Agreed exception: the active sidebar item uses the Council Dashboard green #10b981 with
    // white text (2.53:1), fixed by the Council design system. Every other element is checked.
    .exclude('[data-sidebar="menu-button"][data-active="true"]')
    .analyze()
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  )
  const report = blocking.flatMap((v) =>
    v.nodes.slice(0, 5).map((n) => {
      const detail = n.failureSummary?.split("\n")[1]?.trim() ?? ""
      return `${v.id} | ${n.target.join(" ")} | ${detail}`
    }),
  )
  expect(report, "accessibility violations").toEqual([])
}
