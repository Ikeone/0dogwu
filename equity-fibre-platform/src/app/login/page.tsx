"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import { Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign in failed");
      router.push(data.isStaff ? "/admin" : "/portal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
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

        <div className="mx-auto mt-12 max-w-md">
          <Card>
            <h1 className="text-xl font-semibold text-ink">Sign in</h1>
            <p className="mt-1 text-sm text-ink-faint">Welcome back. Enter your email and password.</p>
            <form className="mt-5 space-y-3" onSubmit={signIn}>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" className="input" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required
                  value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.nz" />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" className="input" type="password" autoComplete="current-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
              </div>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button className="btn-primary w-full" type="submit" disabled={busy || !email || !password}>
                {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-ink-faint">
              New here? <Link href="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
