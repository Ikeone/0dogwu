"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewActions({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function decide(outcome: string) {
    if (!reason.trim()) { setMsg("Please give a reason (recorded in the audit trail)."); return; }
    setBusy(outcome);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/applications/decide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationId, outcome, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <textarea className="input" rows={2} placeholder="Reason (required, audited)" value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => decide("ELIGIBLE")} disabled={busy !== null}>Approve (eligible)</button>
        <button className="btn-secondary" onClick={() => decide("NEEDS_INFORMATION")} disabled={busy !== null}>Request more info</button>
        <button className="btn-secondary" onClick={() => decide("INELIGIBLE")} disabled={busy !== null}>Decline</button>
      </div>
      {msg ? <p className="text-sm text-rose-600">{msg}</p> : null}
    </div>
  );
}
