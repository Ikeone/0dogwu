"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RetryButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function retry() {
    setBusy(true);
    try {
      await fetch("/api/admin/provisioning/retry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return <button className="btn-secondary px-3 py-1.5 text-xs" onClick={retry} disabled={busy}>{busy ? "Retrying…" : "Retry job"}</button>;
}
