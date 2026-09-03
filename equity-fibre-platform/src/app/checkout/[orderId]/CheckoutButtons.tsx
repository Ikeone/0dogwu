"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CheckoutButtons({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function pay(outcome: "succeeded" | "failed" | "abandoned") {
    setBusy(outcome);
    setMsg(null);
    try {
      const res = await fetch("/api/checkout/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId, outcome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Payment failed");
      if (outcome === "succeeded") {
        router.push("/portal");
        router.refresh();
      } else if (outcome === "failed") {
        setMsg("Payment failed (simulated). You can try again.");
      } else {
        setMsg("Checkout abandoned (simulated). Nothing was charged.");
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <button className="btn-primary w-full" onClick={() => pay("succeeded")} disabled={busy !== null}>
        {busy === "succeeded" ? "Processing…" : "Pay successfully (simulate)"}
      </button>
      <div className="flex gap-2">
        <button className="btn-secondary flex-1" onClick={() => pay("failed")} disabled={busy !== null}>Simulate failure</button>
        <button className="btn-ghost flex-1" onClick={() => pay("abandoned")} disabled={busy !== null}>Abandon</button>
      </div>
      {msg ? <p className="pt-1 text-sm text-ink-soft">{msg}</p> : null}
    </div>
  );
}
