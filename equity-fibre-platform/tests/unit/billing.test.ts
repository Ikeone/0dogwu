import { describe, it, expect } from "vitest";
import { shouldStartMonthlyBilling, shouldCollectModemPayment } from "@/lib/domain/billing";
import { DEFAULT_BUSINESS_CONFIG } from "@/lib/config/business";
import { sniffFileType } from "@/lib/services/evidence";

const cfg = DEFAULT_BUSINESS_CONFIG;

describe("billing triggers", () => {
  it("starts monthly billing at service activation by default", () => {
    expect(shouldStartMonthlyBilling("SERVICE_ACTIVATED", cfg)).toBe(true);
    expect(shouldStartMonthlyBilling("MODEM_DELIVERED", cfg)).toBe(false);
  });

  it("honours a MODEM_DELIVERY override", () => {
    const c = { ...cfg, billing: { ...cfg.billing, monthlyBillingTrigger: "MODEM_DELIVERY" as const } };
    expect(shouldStartMonthlyBilling("MODEM_DELIVERED", c)).toBe(true);
    expect(shouldStartMonthlyBilling("SERVICE_ACTIVATED", c)).toBe(false);
  });

  it("collects modem payment before shipment by default", () => {
    expect(shouldCollectModemPayment("BEFORE_SHIPMENT", cfg)).toBe(true);
    expect(shouldCollectModemPayment("ON_DELIVERY", cfg)).toBe(false);
  });
});

describe("file signature sniffing", () => {
  it("accepts PNG/JPEG/PDF by magic bytes", () => {
    expect(sniffFileType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0])).mime).toBe("image/png");
    expect(sniffFileType(Buffer.from([0xff, 0xd8, 0xff, 0, 0, 0, 0, 0])).mime).toBe("image/jpeg");
    expect(sniffFileType(Buffer.from([0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0])).mime).toBe("application/pdf");
  });

  it("rejects an executable masquerading as an image", () => {
    // ELF header
    const elf = sniffFileType(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0, 0, 0, 0]));
    expect(elf.ok).toBe(false);
    // Windows PE / script
    const mz = sniffFileType(Buffer.from([0x4d, 0x5a, 0x90, 0, 0, 0, 0, 0]));
    expect(mz.ok).toBe(false);
  });
});
