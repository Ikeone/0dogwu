"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";

interface Cfg {
  monthlyBillingTrigger: string;
  modemPaymentTrigger: string;
  gracePeriodDays: number;
  suspendOnSingleFailure: boolean;
  deductChorusContribution: boolean;
  inactivityDays: number;
}

export function ConfigEditor({ cfg }: { cfg: Cfg }) {
  const router = useRouter();
  const [state, setState] = useState(cfg);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(key: string, value: unknown) {
    const reason = window.prompt(`Reason for changing ${key} (audited):`);
    if (!reason) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/config", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, value, reason }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(`Saved ${key}.`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }

  return (
    <Card>
      <div className="text-sm font-semibold text-ink">Edit rules (Super Admin)</div>
      <div className="mt-3 space-y-3 text-sm">
        <div>
          <label className="label">Monthly billing trigger</label>
          <div className="flex gap-2">
            <select className="input" value={state.monthlyBillingTrigger} onChange={(e) => setState({ ...state, monthlyBillingTrigger: e.target.value })}>
              <option value="SERVICE_ACTIVATION">SERVICE_ACTIVATION</option>
              <option value="MODEM_DELIVERY">MODEM_DELIVERY</option>
              <option value="MANUAL_APPROVAL">MANUAL_APPROVAL</option>
            </select>
            <button className="btn-secondary" disabled={busy} onClick={() => save("billing.monthlyBillingTrigger", state.monthlyBillingTrigger)}>Save</button>
          </div>
        </div>
        <div>
          <label className="label">Grace period (days)</label>
          <div className="flex gap-2">
            <input className="input" type="number" value={state.gracePeriodDays} onChange={(e) => setState({ ...state, gracePeriodDays: Number(e.target.value) })} />
            <button className="btn-secondary" disabled={busy} onClick={() => save("billing.gracePeriodDays", state.gracePeriodDays)}>Save</button>
          </div>
        </div>
        <div>
          <label className="label">Inactivity period (days)</label>
          <div className="flex gap-2">
            <input className="input" type="number" value={state.inactivityDays} onChange={(e) => setState({ ...state, inactivityDays: Number(e.target.value) })} />
            <button className="btn-secondary" disabled={busy} onClick={() => save("eligibility.inactivityDays", state.inactivityDays)}>Save</button>
          </div>
        </div>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5">
          <span>Suspend on a single failed payment</span>
          <input type="checkbox" checked={state.suspendOnSingleFailure} onChange={(e) => { const v = e.target.checked; setState({ ...state, suspendOnSingleFailure: v }); void save("billing.suspendOnSingleFailure", v); }} />
        </label>
        <label className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 p-2.5">
          <span>Deduct Chorus contribution from customer price</span>
          <input type="checkbox" checked={state.deductChorusContribution} onChange={(e) => { const v = e.target.checked; setState({ ...state, deductChorusContribution: v }); void save("modem.deductChorusContribution", v); }} />
        </label>
      </div>
      {msg ? <p className="mt-2 text-sm text-emerald-700">{msg}</p> : null}
    </Card>
  );
}
