import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db";
import { importModems, assignModemToOrder } from "@/lib/services/modems";
import { submitApplication } from "@/lib/services/applications";

async function makeOrder(tag: string) {
  const res = await submitApplication({
    placeRef: "PLACE-ELIGIBLE-99",
    addressLine: `2 Test ${tag} Way`, suburb: "Testville", city: "Demoville", postcode: "7999",
    housingCategory: "public_housing", evidenceType: "community_services_card", evidenceProvided: true,
    contactName: `Test ${tag}`, contactEmail: `t.${tag}@demo.nz`, serviceConsent: true, marketingConsent: false,
    policyVersion: "v1.0-test", scenarioTag: "IT",
  });
  return res.serviceOrderId!;
}

describe("modem single-use assignment", () => {
  it("assigns idempotently to the same order and forbids assigning one device to two orders", async () => {
    const suffix = Date.now().toString();
    await importModems([
      { assetId: `IT-${suffix}`, manufacturer: "TestCo", model: "T1", serialNumber: `ITSN${suffix}`, wanMac: `A6:B1:C2:${suffix.slice(-2)}:00:01` },
    ]);

    const order1 = await makeOrder(`m1${suffix}`);
    const order2 = await makeOrder(`m2${suffix}`);

    const a1 = await assignModemToOrder(order1, "test");
    const a1again = await assignModemToOrder(order1, "test");
    expect(a1again.deviceId).toBe(a1.deviceId); // idempotent for same order

    // Forcing the same device onto a different order violates the unique constraint.
    await expect(
      prisma.modemAssignment.create({ data: { deviceId: a1.deviceId, serviceOrderId: order2 } }),
    ).rejects.toThrow();

    // The device is reserved exactly once.
    const assignments = await prisma.modemAssignment.findMany({ where: { deviceId: a1.deviceId } });
    expect(assignments).toHaveLength(1);
  });

  it("rejects invalid and duplicate MACs on import", async () => {
    const suffix = Date.now().toString();
    const res = await importModems([
      { assetId: `BAD-${suffix}-1`, manufacturer: "TestCo", model: "T1", serialNumber: `BSN${suffix}1`, wanMac: "01:00:5e:00:00:01" }, // multicast
      { assetId: `BAD-${suffix}-2`, manufacturer: "TestCo", model: "T1", serialNumber: `BSN${suffix}2`, wanMac: "not-a-mac" }, // invalid
      { assetId: `OK-${suffix}`, manufacturer: "TestCo", model: "T1", serialNumber: `OKSN${suffix}`, wanMac: `A6:B2:C3:${suffix.slice(-2)}:00:02` },
      { assetId: `DUP-${suffix}`, manufacturer: "TestCo", model: "T1", serialNumber: `OKSN${suffix}`, wanMac: `A6:B2:C3:${suffix.slice(-2)}:00:02` }, // duplicate serial+mac
    ]);
    expect(res.imported).toBe(1);
    expect(res.skipped.length).toBe(3);
  });
});
