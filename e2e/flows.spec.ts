import { expect, expectAccessible, test, waitForPage } from "./fixtures"

test.describe("key provider journeys", () => {
  test("signs out and back in, returning to the page they asked for", async ({ page }) => {
    await page.goto("/")
    await waitForPage(page, /good (morning|afternoon|evening)/i)

    await page.getByRole("button", { name: /sarah m\./i }).click()
    await page.getByRole("menuitem", { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/login$/)

    // A protected page now bounces to sign-in and remembers where to return.
    await page.goto("/messages")
    await expect(page).toHaveURL(/\/login\?next=%2Fmessages/)

    await page.getByLabel(/work email/i).fill("sarah.m@bromleycare.example")
    await page.getByLabel(/^password$/i).fill("wrong")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible()

    await page.getByLabel(/^password$/i).fill("buddii-demo")
    await page.getByRole("button", { name: /sign in/i }).click()
    await waitForPage(page, /messages/i)
  })

  test("creates a support request for a resident", async ({ page }) => {
    await page.goto("/support-requests")
    await waitForPage(page, /support requests/i)
    await page.getByRole("button", { name: /new request/i }).click()

    const sheet = page.getByRole("dialog", { name: /new support request/i })
    await sheet.getByLabel("Resident", { exact: true }).click()
    await page.getByRole("option", { name: /BUD-0018/ }).click()
    await sheet.getByLabel("Type of support").click()
    await page.getByRole("option", { name: "Digital help" }).click()
    await sheet.getByLabel("Goal for this support").fill("Set up video calls with family")
    await sheet.getByRole("checkbox").check()
    await sheet.getByRole("button", { name: /submit to coordinator/i }).click()

    await expect(page.getByText("Support request submitted")).toBeVisible()
    await expect(page.getByRole("cell", { name: /digital help/i })).toBeVisible()
  })

  test("confirms a council assignment", async ({ page }) => {
    await page.goto("/assignments")
    await waitForPage(page, /new assignments/i)
    await expect(page.getByRole("button", { name: /confirm participation/i })).toHaveCount(3)

    await page
      .getByRole("button", { name: /confirm participation/i })
      .first()
      .click()
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /confirm participation/i })
      .click()

    await expect(page.getByText("Participation confirmed")).toBeVisible()
    await expect(page.getByRole("button", { name: /confirm participation/i })).toHaveCount(2)
  })

  test("responds to a flagged volunteer observation", async ({ page }) => {
    await page.goto("/volunteer-activity?filter=needs_response")
    await waitForPage(page, /volunteer activity/i)

    await page.getByRole("button", { name: /^respond$/i }).click()
    const dialog = page.getByRole("dialog", { name: /respond to observation/i })
    await dialog.getByText("Request a welfare check").click()
    await dialog.getByLabel("Your response").fill("Welfare check requested with the coordinator.")
    await dialog.getByRole("button", { name: /save response/i }).click()

    await expect(page.getByText("Response recorded")).toBeVisible()
    await expect(page.getByText("No activity for this filter")).toBeVisible()
  })

  test("opens a resident from the command palette", async ({ page }) => {
    await page.goto("/")
    await waitForPage(page, /good (morning|afternoon|evening)/i)

    await page.getByRole("button", { name: /search residents, pages/i }).click()
    await page.getByPlaceholder(/type a name, buddii id/i).fill("Arthur")
    await page.getByRole("option", { name: /Arthur Miller/ }).click()

    await expect(page).toHaveURL(/\/residents\/BUD-0062$/)
    await waitForPage(page, "Arthur Miller")
  })

  test("an old resident link opens the resident profile", async ({ page }) => {
    await page.goto("/residents/BUD-0033")

    await expect(page).toHaveURL(/\/residents\/BUD-0033$/)
    await waitForPage(page, "Joan Whitfield")
    await expect(page.getByText("A volunteer observation needs your response.")).toBeVisible()
    await expectAccessible(page)
  })

  test("opens a resident from the residents table and switches tabs", async ({ page }) => {
    await page.goto("/residents")
    await waitForPage(page, /^residents$/i)

    await page.getByRole("link", { name: "Harold Bennett" }).click()
    await waitForPage(page, "Harold Bennett")
    await page.getByRole("tab", { name: "4. Outcomes" }).click()
    await expect(page).toHaveURL(/\/residents\/BUD-0018\?tab=outcomes$/)
    await page.getByRole("link", { name: "Residents", exact: true }).first().click()
    await waitForPage(page, /^residents$/i)
  })
})
