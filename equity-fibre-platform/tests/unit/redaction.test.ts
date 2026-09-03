import { describe, it, expect } from "vitest";
import { redactText, maskEmail, redactObject } from "@/lib/domain/redaction";

describe("PII redaction", () => {
  it("redacts emails and phone numbers in text", () => {
    const out = redactText("Contact aroha@example.co.nz or 021 555 1234 today");
    expect(out).not.toContain("aroha@example.co.nz");
    expect(out).toContain("[redacted-email]");
    expect(out).toContain("[redacted-phone]");
  });

  it("masks an email", () => {
    expect(maskEmail("aroha@example.nz")).toBe("a****@example.nz");
  });

  it("redacts sensitive object keys and scrubs strings", () => {
    const out = redactObject({
      email: "x@y.nz",
      password: "hunter2",
      wanMac: "a4:b1:c2:00:00:01",
      note: "call me on 0800 123 456",
      nested: { token: "abc", ok: true },
    }) as Record<string, unknown>;
    expect(out.email).toBe("[redacted]");
    expect(out.password).toBe("[redacted]");
    expect(out.wanMac).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).token).toBe("[redacted]");
    expect((out.nested as Record<string, unknown>).ok).toBe(true);
    expect(out.note).toContain("[redacted");
  });
});
