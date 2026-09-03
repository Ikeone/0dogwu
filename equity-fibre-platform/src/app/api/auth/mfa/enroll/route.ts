import { NextResponse } from "next/server";
import { requireStaff, AuthError } from "@/lib/auth/session";
import { startEnrollment } from "@/lib/auth/mfa";

// Begin TOTP enrolment. Returns a secret + otpauth URL for the authenticator app.
export async function POST() {
  try {
    const user = await requireStaff();
    const { secret, otpauthUrl } = startEnrollment(user.email);
    return NextResponse.json({ secret, otpauthUrl });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.code }, { status: 401 });
    throw err;
  }
}
