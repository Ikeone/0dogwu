"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import { Card } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create your account");
      // Registered + signed in — go to the portal.
      router.push("/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container-page py-10">
        <div className="flex items-center justify-between">
          <Wordmark />
          <Link href="/" className="text-sm text-ink-faint hover:text-ink">Home</Link>
        </div>

        <div className="mx-auto mt-10 max-w-md">
          <Card>
            <h1 className="text-xl font-semibold text-ink">Create your account</h1>
            <p className="mt-1 text-sm text-ink-faint">Set up an account to check eligibility, pay, and track your service.</p>
            <form className="mt-5 space-y-3" onSubmit={submit}>
              <div>
                <label className="label" htmlFor="fullName">Full name</label>
                <input id="fullName" className="input" autoComplete="name" required
                  value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" className="input" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.nz" />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" className="input" type="password" autoComplete="new-password" required minLength={8}
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <div>
                <label className="label" htmlFor="confirm">Confirm password</label>
                <input id="confirm" className="input" type="password" autoComplete="new-password" required
                  value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your password" />
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button className="btn-primary w-full" type="submit" disabled={busy}>
                {busy ? "Creating account…" : "Create account"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-ink-faint">
              Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Sign in</Link>
            </p>
            <p className="mt-3 text-xs text-ink-faint">By creating an account you agree to our (draft) terms and privacy notice. We only collect what we need to check eligibility and provide the service.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
