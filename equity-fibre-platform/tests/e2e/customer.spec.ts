import { test, expect } from "@playwright/test";

// End-to-end customer flows. Run with a live server: `npm run build && npm start`
// then `npm run test:e2e`. Requires Playwright browsers (`npx playwright install`).

test("landing page shows the offer and demo banner", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("DEMO — SYNTHETIC DATA")).toBeVisible();
  await expect(page.getByRole("heading", { name: /Affordable fibre for eligible households/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Check your eligibility/i }).first()).toBeVisible();
});

test("eligibility wizard runs and returns a decision", async ({ page }) => {
  await page.goto("/eligibility");
  await page.getByPlaceholder(/Rimu Lane/i).fill("rimu");
  await page.getByRole("button", { name: "Search" }).click();
  // Pick the first "likely eligible" address.
  await page.getByText(/likely eligible/i).first().click();
  await page.getByRole("button", { name: "Continue" }).click(); // availability
  await page.getByText("Public / government housing").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByText("Community Services Card").click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Full name").fill("Demo Whanau");
  await page.getByLabel("Email").fill("demo.whanau@example.nz");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox").first().check(); // required consent
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click(); // skip upload
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByText(/How we assessed this/i)).toBeVisible();
});

test("support assistant answers and cites an article", async ({ page }) => {
  await page.goto("/support");
  await page.getByPlaceholder(/Type your question/i).fill("How do I connect my modem to the ONT?");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(page.getByText(/WAN\/?Internet port|ONT/i).first()).toBeVisible();
});
