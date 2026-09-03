import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { getEnv } from "@/lib/config/env";

export async function POST() {
  await destroySession();
  return NextResponse.redirect(new URL("/", getEnv().APP_BASE_URL), { status: 303 });
}
