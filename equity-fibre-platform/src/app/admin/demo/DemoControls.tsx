"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GROUPS: { title: string; events: { event: string; label: string }[] }[] = [
  {
    title: "Payment",
    events: [
      { event: "payment_successful", label: "Payment successful" },
      { event: "payment_failed", label: "Payment failed" },
    ],
  },
  {
    title: "Provisioning (Chorus)",
    events: [
      { event: "process_jobs", label: "Run provisioning queue" },
      { event: "provisioning_delayed", label: "Run queue (retry)" },
    ],
  },
  {
    title: "Shipping",
    events: [
      { event: "modem_packed", label: "Modem packed" },
      { event: "modem_shipped", label: "Modem shipped" },
      { event: "modem_delivered", label: "Modem delivered" },
    ],
  },
  {
    title: "Service & billing",
    events: [
      { event: "service_activated", label: "Service activated" },
      { event: "service_suspended", label: "Service suspended" },
      { event: "monthly_payment_success", label: "Monthly payment ✓" },
      { event: "monthly_payment_failure", label: "Monthly payment ✗" },
    ],
  },
];

export function DemoControls({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function fire(event: string) {
    setBusy(event);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event, orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(`Done: ${event.replace(/_/g, " ")}`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{g.title}</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {g.events.map((e) => (
              <button key={e.event} onClick={() => fire(e.event)} disabled={busy !== null}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-soft hover:bg-slate-50 disabled:opacity-50">
                {busy === e.event ? "…" : e.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {msg ? <p className="text-xs text-ink-faint">{msg}</p> : null}
    </div>
  );
}
