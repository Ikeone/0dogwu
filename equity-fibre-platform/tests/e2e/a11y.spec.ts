import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Automated accessibility checks (WCAG 2.1/2.2 A/AA rule sets) via axe-core.
// Requires Playwright browsers + a running server. In CI without browsers this
// is skipped; manual keyboard/screen-reader checks are in docs/ACCESSIBILITY.md.
const PAGES = ["/", "/eligibility", "/support", "/login"];

for (const path of PAGES) {
  test(`a11y: ${path} has no serious/critical violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(serious, JSON.stringify(serious.map((v) => v.id), null, 2)).toHaveLength(0);
  });
}
