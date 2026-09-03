"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import { Card } from "@/components/ui";

const STAFF = [
  { email: "admin@wn.demo", label: "Super Admin", desc: "Full access" },
  { email: "ops@wn.demo", label: "Operations", desc: "Applications, provisioning, inventory" },
  { email: "support@wn.demo", label: "Support", desc: "Tickets & knowledge base" },
  { email: "finance@wn.demo", label: "Finance", desc: "Payments & refunds" },
  { email: "privacy@wn.demo", label: "Privacy Officer", desc: "Evidence & privacy requests" },
];

const CUSTOMERS = [
  { email: "aroha.customer@demo.nz", label: "Aroha (A)", desc: "Active service" },
  { email: "grace.customer@demo.nz", label: "Grace (G)", desc: "Payment in grace period" },
  { email: "finn.customer@demo.nz", label: "Finn (F)", desc: "Provisioning retried" },
];

export default function LoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function demoLogin(email: string) {
    setBusy(email);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push(data.isStaff ? "/admin" : "/portal");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container-page py-10">
        <Wordmark />
        <div className="mx-auto mt-8 grid max-w-4xl gap-6 lg:grid-cols-2">
          <Card>
            <h1 className="text-xl font-semibold text-ink">Staff console</h1>
            <p className="mt-1 text-sm text-ink-faint">One-click demo sign in. Roles enforce what each person can do.</p>
            <div className="mt-4 space-y-2">
              {STAFF.map((s) => (
                <button
                  key={s.email}
                  onClick={() => demoLogin(s.email)}
                  disabled={busy !== null}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                >
                  <span>
                    <span className="font-medium text-ink">{s.label}</span>
                    <span className="block text-xs text-ink-faint">{s.desc}</span>
                  </span>
                  <span className="text-xs font-semibold text-brand-700">{busy === s.email ? "…" : "Sign in"}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h1 className="text-xl font-semibold text-ink">Customer portal</h1>
            <p className="mt-1 text-sm text-ink-faint">Sign in as a demo customer to see their portal.</p>
            <div className="mt-4 space-y-2">
              {CUSTOMERS.map((c) => (
                <button
                  key={c.email}
                  onClick={() => demoLogin(c.email)}
                  disabled={busy !== null}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 p-3 text-left hover:bg-slate-50"
                >
                  <span>
                    <span className="font-medium text-ink">{c.label}</span>
                    <span className="block text-xs text-ink-faint">{c.desc}</span>
                  </span>
                  <span className="text-xs font-semibold text-brand-700">{busy === c.email ? "…" : "Sign in"}</span>
                </button>
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              Demo accounts only. All data is synthetic. Password for all demo accounts is <code>demo1234</code>.
            </p>
          </Card>
        </div>
        {error ? <p className="mx-auto mt-4 max-w-4xl text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
