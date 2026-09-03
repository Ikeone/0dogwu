import { describe, it, expect } from "vitest";
import { normaliseMac, isValidMac, InvalidMacError } from "@/lib/domain/mac";

describe("MAC normalisation & validation", () => {
  it("normalises colon, hyphen, dot and bare formats to canonical form", () => {
    expect(normaliseMac("A4:B1:C2:00:11:22")).toBe("a4:b1:c2:00:11:22");
    expect(normaliseMac("A4-B1-C2-00-11-22")).toBe("a4:b1:c2:00:11:22");
    expect(normaliseMac("a4b1.c200.1122")).toBe("a4:b1:c2:00:11:22");
    expect(normaliseMac("a4b1c2001122")).toBe("a4:b1:c2:00:11:22");
  });

  it("rejects wrong length / non-hex", () => {
    expect(() => normaliseMac("A4:B1:C2:00:11")).toThrow(InvalidMacError);
    expect(() => normaliseMac("ZZ:B1:C2:00:11:22")).toThrow(InvalidMacError);
  });

  it("rejects multicast MAC (I/G bit set)", () => {
    // 0x01 first octet -> multicast
    expect(() => normaliseMac("01:00:5e:00:00:01")).toThrow(/multicast/i);
    expect(isValidMac("01:00:5e:00:00:01")).toBe(false);
  });

  it("rejects all-zero and broadcast", () => {
    expect(() => normaliseMac("00:00:00:00:00:00")).toThrow();
    expect(() => normaliseMac("ff:ff:ff:ff:ff:ff")).toThrow();
  });

  it("accepts a valid unicast MAC", () => {
    expect(isValidMac("A4:B1:C2:00:00:01")).toBe(true);
  });
});
