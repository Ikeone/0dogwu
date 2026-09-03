import { test, expect } from "@playwright/test";

// Security-oriented E2E checks (server-side authorization).

test("unauthenticated admin API is rejected", async ({ request }) => {
  const res = await request.post("/api/admin/demo", { data: { event: "payment_successful", orderId: "x" } });
  expect(res.status()).toBe(401);
});

test("unauthenticated account tool is rejected", async ({ request }) => {
  const res = await request.post("/api/support/tool", { data: { tool: "get_my_order_status" } });
  expect(res.status()).toBe(401);
});

test("admin pages redirect anonymous users to login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("provider secrets are not exposed via public config", async ({ request }) => {
  const res = await request.get("/api/config/public");
  const body = await res.text();
  expect(body).not.toMatch(/secret|client_secret|api_key|AUTH_SECRET/i);
});

test("security headers: nonce CSP without unsafe-inline scripts + core headers", async ({ request }) => {
  const res = await request.get("/");
  const csp = res.headers()["content-security-policy"] ?? "";
  expect(csp).toMatch(/script-src[^;]*'nonce-/);
  expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  expect(res.headers()["x-frame-options"]).toBe("DENY");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
  expect(res.headers()["strict-transport-security"]).toContain("max-age=");
});
