/**
 * k6 load smoke test. Requires k6 (https://k6.io) + a running server:
 *   k6 run tests/load/smoke.js   (or: BASE_URL=... k6 run ...)
 *
 * Performance targets (proposed, see docs/PERFORMANCE_TEST_REPORT.md):
 *   - p95 landing < 800ms, p95 eligibility config < 500ms, error rate < 1%.
 * NOT executed in the build VM (k6 not installed). This is a real script.
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m", target: 50 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const landing = http.get(`${BASE}/`);
  check(landing, { "landing 200": (r) => r.status === 200 });

  const cfg = http.get(`${BASE}/api/config/public`);
  check(cfg, { "config 200": (r) => r.status === 200 });

  const addr = http.get(`${BASE}/api/eligibility/address-search?q=rimu`);
  check(addr, { "address search 200": (r) => r.status === 200 });

  sleep(1);
}
