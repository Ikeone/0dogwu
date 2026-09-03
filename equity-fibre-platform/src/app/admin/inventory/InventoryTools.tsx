"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";

export function InventoryTools() {
  const router = useRouter();
  const [csv, setCsv] = useState("assetId,manufacturer,model,serialNumber,wanMac,supplierBatch\nWN-ASSET-2001,GenericCo,GX-100,SN200001,A4-B1-C2-00-01-01,BATCH-2025-10");
  const [single, setSingle] = useState({ assetId: "", manufacturer: "GenericCo", model: "GX-100", serialNumber: "", wanMac: "", supplierBatch: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function importCsv() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/inventory/import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csv }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(`Imported ${data.imported}. Skipped ${data.skipped?.length ?? 0}${data.skipped?.length ? `: ${data.skipped.map((s: { reason: string }) => s.reason).join("; ")}` : ""}.`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }

  async function addOne() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/admin/inventory/add", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(single) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg("Device added.");
      setSingle({ ...single, assetId: "", serialNumber: "", wanMac: "" });
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Failed"); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <div className="text-sm font-semibold text-ink">CSV import</div>
        <p className="mt-1 text-xs text-ink-faint">Columns: assetId, manufacturer, model, serialNumber, wanMac, supplierBatch. Duplicates & invalid MACs are skipped.</p>
        <textarea className="input mt-2 font-mono text-xs" rows={4} value={csv} onChange={(e) => setCsv(e.target.value)} />
        <button className="btn-primary mt-2" onClick={importCsv} disabled={busy}>Import CSV</button>
      </Card>
      <Card>
        <div className="text-sm font-semibold text-ink">Add single device</div>
        <p className="mt-1 text-xs text-ink-faint">Barcode-scanner friendly. MAC accepts any common format.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input className="input" placeholder="Asset ID" value={single.assetId} onChange={(e) => setSingle({ ...single, assetId: e.target.value })} />
          <input className="input" placeholder="Serial number" value={single.serialNumber} onChange={(e) => setSingle({ ...single, serialNumber: e.target.value })} />
          <input className="input col-span-2" placeholder="WAN MAC (e.g. A4:B1:C2:00:09:99)" value={single.wanMac} onChange={(e) => setSingle({ ...single, wanMac: e.target.value })} />
        </div>
        <button className="btn-secondary mt-2" onClick={addOne} disabled={busy}>Add device</button>
      </Card>
      {msg ? <p className="text-sm text-ink-soft lg:col-span-2">{msg}</p> : null}
    </div>
  );
}
