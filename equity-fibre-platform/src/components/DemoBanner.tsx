import { getEnv } from "@/lib/config/env";

/** Persistent "DEMO — SYNTHETIC DATA" banner shown whenever DEMO_MODE=true. */
export function DemoBanner() {
  let demo = true;
  try {
    demo = getEnv().DEMO_MODE;
  } catch {
    demo = true;
  }
  if (!demo) return null;
  return (
    <div className="bg-amber-400 text-amber-950">
      <div className="container-page flex items-center justify-center gap-2 py-1.5 text-center text-xs font-semibold sm:text-sm">
        <span aria-hidden>●</span>
        DEMO — SYNTHETIC DATA. No real customers, addresses, documents or payments. External providers are mocked.
      </div>
    </div>
  );
}
