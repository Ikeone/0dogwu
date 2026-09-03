import { describe, it, expect } from "vitest";
import { authenticator } from "otplib";
import { prisma } from "@/lib/db";
import { startEnrollment, confirmEnrollment, verifyTotp, consumeRecoveryCode } from "@/lib/auth/mfa";
import { encryptField, decryptField } from "@/lib/security/fieldCrypto";
import { createApprovalRequest, approveRequest, SelfApprovalError } from "@/lib/services/approvals";

async function staffUser(tag: string) {
  return prisma.user.create({
    data: { email: `mfa.${tag}@wn.demo`, displayName: `MFA ${tag}`, roles: "SUPER_ADMIN", isStaff: true },
  });
}

describe("field encryption", () => {
  it("round-trips and is authenticated (tamper fails)", () => {
    const enc = encryptField("s3cr3t-totp-seed");
    expect(decryptField(enc)).toBe("s3cr3t-totp-seed");
    const tampered = enc.slice(0, -4) + "AAAA";
    expect(() => decryptField(tampered)).toThrow();
  });
});

describe("staff MFA (TOTP)", () => {
  it("enrols, verifies a valid token, rejects a bad token, and consumes single-use recovery codes", async () => {
    const user = await staffUser(`t${Date.now()}`);
    const { secret } = startEnrollment(user.email);
    const goodToken = authenticator.generate(secret);
    const recoveryCodes = await confirmEnrollment(user.id, secret, goodToken);
    expect(recoveryCodes).toHaveLength(8);

    const refreshed = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(refreshed.mfaEnrolled).toBe(true);
    expect(refreshed.mfaSecretEnc).toBeTruthy();
    // Secret is stored encrypted, not in plaintext.
    expect(refreshed.mfaSecretEnc).not.toContain(secret);

    expect(await verifyTotp(user.id, authenticator.generate(secret))).toBe(true);
    expect(await verifyTotp(user.id, "000000")).toBe(false);

    // Recovery code is single-use.
    const code = recoveryCodes[0]!;
    expect(await consumeRecoveryCode(user.id, code)).toBe(true);
    expect(await consumeRecoveryCode(user.id, code)).toBe(false);
    // A code from another user must not work.
    const other = await staffUser(`o${Date.now()}`);
    expect(await consumeRecoveryCode(other.id, recoveryCodes[1]!)).toBe(false);
  });

  it("rejects enrolment confirmation with an incorrect code", async () => {
    const user = await staffUser(`b${Date.now()}`);
    const { secret } = startEnrollment(user.email);
    await expect(confirmEnrollment(user.id, secret, "000000")).rejects.toThrow();
  });
});

describe("maker-checker approvals", () => {
  it("allows a different checker to approve but forbids self-approval", async () => {
    const maker = await staffUser(`mk${Date.now()}`);
    const checker = await staffUser(`ck${Date.now()}`);
    const req = await createApprovalRequest("config_change", { key: "billing.gracePeriodDays", value: 30 }, maker.id, maker.email, "extend grace");

    await expect(approveRequest(req.id, maker.id, maker.email)).rejects.toBeInstanceOf(SelfApprovalError);

    const result = await approveRequest(req.id, checker.id, checker.email);
    expect(result.type).toBe("config_change");
    const applied = await prisma.approvalRequest.findUniqueOrThrow({ where: { id: req.id } });
    expect(applied.status).toBe("approved");
    expect(applied.approvedById).toBe(checker.id);
  });
});
