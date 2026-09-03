"use client";

import { useState } from "react";
import { Pill } from "@/components/ui";

export function EvidenceViewer({ evidenceId, name, mime, state }: { evidenceId: string; name: string; mime: string; state: string }) {
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/evidence/sign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ evidenceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setUrl(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-ink">{name}</div>
          <div className="text-xs text-ink-faint">{mime}</div>
        </div>
        <div className="flex items-center gap-2">
          <Pill tone={state === "accepted" ? "green" : state === "rejected" ? "red" : "amber"}>{state}</Pill>
          <button className="btn-secondary px-3 py-1.5 text-xs" onClick={open} disabled={busy}>{busy ? "…" : "View (time-limited)"}</button>
        </div>
      </div>
      {url ? <a href={url} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-brand-700 hover:underline">Open secure link (expires in 2 minutes) →</a> : null}
      {err ? <p className="mt-1 text-xs text-rose-600">{err}</p> : null}
    </div>
  );
}
