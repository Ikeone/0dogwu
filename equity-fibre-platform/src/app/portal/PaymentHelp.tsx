"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PaymentHelp() {
  const router = useRouter();
  const [kind, setKind] = useState<"hardship" | "dispute">("hardship");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    if (reason.trim().length < 3) { setMsg("Please tell us briefly what's happening."); return; }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/portal/hardship", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(`Thanks — your ${kind === "hardship" ? "hardship request" : "dispute"} (${data.reference}) is open and your service is protected from suspension while we help.`);
      setReason("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-2 text-sm">
        <button className={`rounded-lg px-2.5 py-1.5 ${kind === "hardship" ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-soft"}`} onClick={() => setKind("hardship")}>Payment difficulty</button>
        <button className={`rounded-lg px-2.5 py-1.5 ${kind === "dispute" ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-soft"}`} onClick={() => setKind("dispute")}>Dispute a charge</button>
      </div>
      <textarea className="input" rows={2} placeholder={kind === "hardship" ? "Tell us what's making payment hard right now…" : "Tell us what charge you're disputing…"} value={reason} onChange={(e) => setReason(e.target.value)} />
      <button className="btn-primary w-full" disabled={busy} onClick={submit}>{busy ? "Sending…" : kind === "hardship" ? "Request payment help" : "Raise a dispute"}</button>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      <p className="text-xs text-ink-faint">Raising either one protects you: we won’t automatically suspend your service while your case is open.</p>
    </div>
  );
}
