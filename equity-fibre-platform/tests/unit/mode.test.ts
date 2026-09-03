import { describe, it, expect } from "vitest";
import { evaluateModePolicy } from "@/lib/config/mode";

describe("environment + provider mode policy", () => {
  it("DEMO allows mocks", () => {
    const r = evaluateModePolicy({ SYSTEM_MODE: "DEMO" });
    expect(r.systemMode).toBe("DEMO");
    expect(r.ok).toBe(true);
  });

  it("PILOT forbids MOCK providers", () => {
    const r = evaluateModePolicy({ SYSTEM_MODE: "PILOT", PAYMENT_MODE: "MOCK" });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes("MODE-002") && v.includes("payment"))).toBe(true);
  });

  it("PRODUCTION with the demo env fails closed on multiple controls", () => {
    const r = evaluateModePolicy({
      SYSTEM_MODE: "PRODUCTION",
      DEMO_MODE: "true",
      AUTH_SECRET: "dev-only-insecure-change-me",
      FIELD_ENCRYPTION_KEY: "dev-only-insecure-change-me-32byte",
      DATABASE_URL: "file:./dev.db",
      PAYMENT_MODE: "MOCK",
      STORAGE_MODE: "MOCK",
    });
    expect(r.ok).toBe(false);
    const codes = r.violations.join(" ");
    expect(codes).toContain("MODE-002"); // mock forbidden
    expect(codes).toContain("MODE-010"); // demo mode
    expect(codes).toContain("SEC-010"); // auth secret
    expect(codes).toContain("SEC-011"); // field encryption key
    expect(codes).toContain("DB-010"); // sqlite
    expect(codes).toContain("SEC-012"); // local storage
  });

  it("PRODUCTION forbids DISABLED critical providers", () => {
    const r = evaluateModePolicy({
      SYSTEM_MODE: "PRODUCTION",
      DEMO_MODE: "false",
      AUTH_SECRET: "x".repeat(40),
      FIELD_ENCRYPTION_KEY: "y".repeat(40),
      DATABASE_URL: "postgresql://a/b",
      STORAGE_MODE: "PRODUCTION",
      PAYMENT_MODE: "DISABLED",
      PROVISIONING_MODE: "SANDBOX",
      NETWORK_MODE: "MANUAL",
      ADDRESS_MODE: "SANDBOX",
      SHIPPING_MODE: "PRODUCTION",
      EMAIL_MODE: "PRODUCTION",
      SMS_MODE: "PRODUCTION",
      AI_MODE: "MANUAL",
      EVIDENCE_VERIFICATION_MODE: "MANUAL",
    });
    expect(r.ok).toBe(false);
    expect(r.violations.some((v) => v.includes("MODE-003") && v.includes("payment"))).toBe(true);
  });

  it("a fully-configured PRODUCTION env passes", () => {
    const r = evaluateModePolicy({
      SYSTEM_MODE: "PRODUCTION",
      DEMO_MODE: "false",
      AUTH_SECRET: "x".repeat(40),
      FIELD_ENCRYPTION_KEY: "y".repeat(40),
      DATABASE_URL: "postgresql://a/b",
      STORAGE_MODE: "PRODUCTION",
      ADDRESS_MODE: "PRODUCTION",
      PROVISIONING_MODE: "PRODUCTION",
      NETWORK_MODE: "MANUAL",
      PAYMENT_MODE: "SANDBOX",
      SHIPPING_MODE: "PRODUCTION",
      EMAIL_MODE: "PRODUCTION",
      SMS_MODE: "PRODUCTION",
      AI_MODE: "MANUAL",
      EVIDENCE_VERIFICATION_MODE: "MANUAL",
    });
    expect(r.ok).toBe(true);
  });
});
