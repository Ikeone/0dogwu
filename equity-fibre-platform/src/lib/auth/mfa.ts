/**
 * Staff MFA (TOTP) using the `otplib` library (RFC 6238) + hashed single-use
 * recovery codes. TOTP secrets are envelope-encrypted at rest. Enforcement
 * (staff must have MFA in PILOT/PRODUCTION) is checked at login/step-up.
 */
import { authenticator } from "otplib";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { encryptField, decryptField } from "@/lib/security/fieldCrypto";
import { recordAudit } from "@/lib/services/audit";

authenticator.options = { window: 1 }; // tolerate 1 step of clock drift

export interface EnrollmentStart {
  secret: string;
  otpauthUrl: string;
}

/** Begin enrolment: returns a secret + otpauth URL (for a QR code). */
export function startEnrollment(email: string): EnrollmentStart {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, "WN Stride Broadband", secret);
  return { secret, otpauthUrl };
}

/** Confirm enrolment: verify a token against the candidate secret, then store. */
export async function confirmEnrollment(userId: string, secret: string, token: string): Promise<string[]> {
  if (!authenticator.verify({ token, secret })) {
    throw new Error("Incorrect verification code.");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { mfaEnrolled: true, mfaSecretEnc: encryptField(secret) },
  });
  // Issue recovery codes (returned once; only hashes are stored).
  const codes = Array.from({ length: 8 }, () => randomBytes(5).toString("hex"));
  await prisma.mfaRecoveryCode.deleteMany({ where: { userId } });
  await prisma.mfaRecoveryCode.createMany({
    data: codes.map((c) => ({ userId, codeHash: hashCode(c) })),
  });
  await recordAudit({ type: "mfa.enrolled", actorId: userId, actorLabel: userId, targetType: "user", targetId: userId });
  return codes;
}

export async function verifyTotp(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecretEnc) return false;
  const secret = decryptField(user.mfaSecretEnc);
  const ok = authenticator.verify({ token, secret });
  if (!ok) await recordAudit({ type: "mfa.failed", actorId: userId, actorLabel: user.email, targetType: "user", targetId: userId });
  return ok;
}

function hashCode(code: string): string {
  return createHash("sha256").update(`recovery:${code}`).digest("hex");
}

/** Consume a recovery code (single-use). Returns true if valid + unused. */
export async function consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
  const row = await prisma.mfaRecoveryCode.findUnique({ where: { codeHash: hashCode(code) } });
  if (!row || row.userId !== userId || row.usedAt) return false;
  await prisma.mfaRecoveryCode.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  await recordAudit({ type: "mfa.recovery_used", actorId: userId, actorLabel: userId, targetType: "user", targetId: userId });
  return true;
}
