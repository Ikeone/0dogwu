"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TicketActions({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function act(action: "take_over" | "resolve") {
    setBusy(true);
    try {
      await fetch("/api/admin/support/resolve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ticketId, action, category: action === "resolve" ? "resolved" : undefined }) });
      router.refresh();
    } finally { setBusy(false); }
  }
  return (
    <div className="flex gap-2">
      <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => act("take_over")} disabled={busy}>Take over</button>
      <button className="btn-primary px-3 py-1.5 text-xs" onClick={() => act("resolve")} disabled={busy}>Resolve</button>
    </div>
  );
}
