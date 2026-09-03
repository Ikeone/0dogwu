import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-ink">{children}</h2>
      {sub ? <p className="mt-1 text-sm text-ink-faint">{sub}</p> : null}
    </div>
  );
}

const STATUS_TONE: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  red: "bg-rose-50 text-rose-700 ring-rose-600/20",
  blue: "bg-brand-50 text-brand-700 ring-brand-600/20",
  slate: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export function Pill({ tone = "slate", children }: { tone?: keyof typeof STATUS_TONE | string; children: ReactNode }) {
  const cls = STATUS_TONE[tone] ?? STATUS_TONE.slate;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {children}
    </span>
  );
}

/** Map a domain status string to a tone for consistent colour coding. */
export function statusTone(status: string): string {
  const s = status.toUpperCase();
  if (["ACTIVE", "ELIGIBLE", "COMPLETED", "DELIVERED", "SUCCEEDED", "PASS"].some((x) => s.includes(x))) return "green";
  if (["FAILED", "INELIGIBLE", "BLOCKED", "DEAD_LETTER", "SUSPENDED", "FAULTY", "LOST"].some((x) => s.includes(x))) return "red";
  if (["PENDING", "AWAITING", "REVIEW", "NEEDS", "GRACE", "PAST_DUE", "RESERVED", "IN_PROGRESS", "REQUESTED"].some((x) => s.includes(x))) return "amber";
  return "slate";
}

export function StatusPill({ status }: { status: string }) {
  return <Pill tone={statusTone(status)}>{status.replace(/_/g, " ").toLowerCase()}</Pill>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
      {hint ? <div className="mt-1 text-xs text-ink-faint">{hint}</div> : null}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
      <div className="text-sm font-medium text-ink">{title}</div>
      {hint ? <div className="mt-1 text-sm text-ink-faint">{hint}</div> : null}
    </div>
  );
}
