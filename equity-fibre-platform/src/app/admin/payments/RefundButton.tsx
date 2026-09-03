"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefundButton({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function refund() {
    const reason = window.prompt("Reason for refund (audited):");
    if (!reason) return;
    setBusy(true);
    try {
      await fetch("/api/admin/payments/refund", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ transactionId, reason }) });
      router.refresh();
    } finally { setBusy(false); }
  }
  return <button className="btn-ghost px-3 py-1.5 text-xs" onClick={refund} disabled={busy}>{busy ? "…" : "Refund"}</button>;
}
