"use client";

import { useState } from "react";

export function PrivacyForm() {
  const [kind, setKind] = useState("access");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/privacy/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, detail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(`Request received. Reference ${data.reference}. Our privacy team will follow up.`);
      setDetail("");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="label">Request type</label>
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="access">Access my information</option>
          <option value="correction">Correct my information</option>
          <option value="deletion">Delete my information</option>
        </select>
      </div>
      <div>
        <label className="label">Details (optional)</label>
        <textarea className="input" rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Tell us what you need…" />
      </div>
      <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? "Sending…" : "Submit request"}</button>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
    </div>
  );
}
