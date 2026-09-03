"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pill } from "@/components/ui";

async function post(body: unknown) {
  const res = await fetch("/api/admin/hardship", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function HardshipActions({ kind, id }: { kind: "hardship" | "dispute"; id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function resolve(status: string) {
    setBusy(true);
    try {
      await post(kind === "hardship"
        ? { action: "resolve_hardship", caseId: id, status }
        : { action: "resolve_dispute", disputeId: id, status });
      router.refresh();
    } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {kind === "hardship" ? (
        <>
          <button className="btn-primary px-3 py-1.5 text-xs" disabled={busy} onClick={() => resolve("resolved")}>Resolve</button>
          <button className="btn-ghost px-3 py-1.5 text-xs" disabled={busy} onClick={() => resolve("declined")}>Decline</button>
        </>
      ) : (
        <>
          <button className="btn-primary px-3 py-1.5 text-xs" disabled={busy} onClick={() => resolve("upheld")}>Uphold</button>
          <button className="btn-secondary px-3 py-1.5 text-xs" disabled={busy} onClick={() => resolve("resolved")}>Resolve</button>
          <button className="btn-ghost px-3 py-1.5 text-xs" disabled={busy} onClick={() => resolve("rejected")}>Reject</button>
        </>
      )}
    </div>
  );
}

export function HoldActions({ holdId }: { holdId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function close() {
    const reason = window.prompt("Reason for removing this hold (audited):");
    if (!reason) return;
    setBusy(true);
    try {
      await fetch("/api/admin/holds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "close", holdId, reason }),
      });
      router.refresh();
    } finally { setBusy(false); }
  }
  return <button className="btn-ghost px-3 py-1.5 text-xs" disabled={busy} onClick={close}>Remove hold</button>;
}

export function SuspensionPreview({ serviceOrderId }: { serviceOrderId: string }) {
  const [result, setResult] = useState<{ outcome: string; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);
  async function preview() {
    setBusy(true);
    try {
      const data = await post({ action: "preview_suspension", serviceOrderId });
      setResult(data.result);
    } finally { setBusy(false); }
  }
  const tone = result?.outcome === "blocked" ? "green" : result?.outcome === "suspended" ? "red" : "slate";
  return (
    <div className="flex items-center gap-2">
      {result ? <Pill tone={tone}>{result.outcome}: {result.reason}</Pill> : null}
      <button className="btn-secondary px-3 py-1.5 text-xs" disabled={busy} onClick={preview}>{busy ? "…" : "Preview"}</button>
    </div>
  );
}
