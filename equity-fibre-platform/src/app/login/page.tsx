"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import { Card } from "@/components/ui";

const DEMO_STAFF = [
  { email: "admin@wn.demo", label: "Super Admin" },
  { email: "ops@wn.demo", label: "Operations" },
  { email: "support@wn.demo", label: "Support" },
  { email: "finance@wn.demo", label: "Finance" },
  { email: "privacy@wn.demo", label: "Privacy Officer" },
];
const DEMO_CUSTOMERS = [
  { email: "aroha.customer@demo.nz", label: "Aroha — active service" },
  { email: "grace.customer@demo.nz", label: "Grace — payment in grace" },
  { email: "finn.customer@demo.nz", label: "Finn — provisioning retried" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function go(isStaff: boolean) {
    router.push(isStaff ? "/admin" : "/portal");
    router.refresh();
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign in failed");
      go(Boolean(data.isStaff));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin(demoEmail: string) {
    setDemoBusy(demoEmail);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: demoEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Demo login unavailable");
      go(Boolean(data.isStaff));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setDemoBusy(null);
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
            <h1 className="text-xl font-semibold text-ink">Sign in</h1>
            <p className="mt-1 text-sm text-ink-faint">Welcome back. Enter your email and password.</p>
            <form className="mt-5 space-y-3" onSubmit={signIn}>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" className="input" type="email" autoComplete="email" required
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
            <p className="mt-4 text-center text-sm text-ink-faint">
              New here? <Link href="/register" className="font-semibold text-brand-700 hover:underline">Create an account</Link>
            </p>
          </Card>

          {/* Demo quick-login (works while DEMO_MODE is on). */}
          <div className="mt-4 text-center">
            <button className="text-xs text-ink-faint underline hover:text-ink" onClick={() => setShowDemo((v) => !v)}>
              {showDemo ? "Hide demo accounts" : "Explore with a demo account"}
            </button>
          </div>
          {showDemo ? (
            <Card className="mt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Demo customers</div>
              <div className="mt-2 space-y-1.5">
                {DEMO_CUSTOMERS.map((c) => (
                  <button key={c.email} onClick={() => demoLogin(c.email)} disabled={demoBusy !== null}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-2.5 text-left text-sm hover:bg-slate-50">
                    <span className="text-ink">{c.label}</span>
                    <span className="text-xs font-semibold text-brand-700">{demoBusy === c.email ? "…" : "Sign in"}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Demo staff</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {DEMO_STAFF.map((s) => (
                  <button key={s.email} onClick={() => demoLogin(s.email)} disabled={demoBusy !== null}
                    className="rounded-lg border border-slate-200 p-2 text-left text-xs hover:bg-slate-50">
                    <span className="font-medium text-ink">{s.label}</span>
                  </button>
                ))}
              </div>
              <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                Demo accounts use synthetic data. Password for all demo accounts is <code>demo1234</code> (you can also sign in with them via the form above).
              </p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
