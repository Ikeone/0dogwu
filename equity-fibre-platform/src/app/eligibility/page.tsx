"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import { Card, Pill } from "@/components/ui";

interface Candidate {
  placeRef: string;
  line1: string;
  suburb: string;
  city: string;
  postcode: string;
  site: { hasOnt: boolean; daysSinceLastActive: number | null; indeterminate?: boolean };
}

interface PublicConfig {
  plan: { name: string; downloadMbps: number; uploadMbps: number; monthlyPriceCents: number };
  modemContributionCents: number;
  inactivityDays: number;
  enabledHousingCategories: string[];
  enabledEvidenceTypes: string[];
  allowedMimeTypes: string[];
}

const HOUSING_OPTIONS = [
  { value: "public_housing", label: "Public / government housing" },
  { value: "community_housing", label: "Community housing" },
  { value: "school_equity", label: "Child at a qualifying-equity school" },
  { value: "none", label: "None of these" },
];
const EVIDENCE_OPTIONS = [
  { value: "community_services_card", label: "Community Services Card" },
  { value: "msd_benefit_letter", label: "MyMSD Benefit Breakdown Letter" },
  { value: "none", label: "I don't have these yet" },
];

const STEPS = ["Address", "Availability", "Household", "Evidence type", "Your details", "Privacy", "Upload", "Review"];

export default function EligibilityWizard() {
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [housing, setHousing] = useState("");
  const [evidenceType, setEvidenceType] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceConsent, setServiceConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<null | { reference: string; outcome: string; reason: string; results: { ruleCode: string; outcome: string; reason: string }[]; serviceOrderId: string | null }>(null);

  useEffect(() => {
    fetch("/api/config/public").then((r) => r.json()).then(setCfg).catch(() => undefined);
  }, []);

  async function doSearch() {
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/eligibility/address-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCandidates(data.candidates ?? []);
    } catch {
      setError("Address search failed. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  const availabilityVerdict = useMemo(() => {
    if (!selected || !cfg) return null;
    const s = selected.site;
    if (!s.hasOnt) return { tone: "red", label: "Not currently eligible", detail: "There is no Chorus fibre box (ONT) at this address." };
    if (s.indeterminate) return { tone: "amber", label: "Needs review", detail: "We couldn't confirm the connection history and will review this manually." };
    if (s.daysSinceLastActive !== null && s.daysSinceLastActive < cfg.inactivityDays) {
      return { tone: "red", label: "Not currently eligible", detail: `Fibre was active within the last ${cfg.inactivityDays} days at this address.` };
    }
    return { tone: "green", label: "Looks promising", detail: "There's an ONT and the connection has been inactive long enough. Let's continue." };
  }, [selected, cfg]);

  function next() { setStep((s) => Math.min(STEPS.length - 1, s + 1)); }
  function back() { setStep((s) => Math.max(0, s - 1)); }

  const canContinue = useMemo(() => {
    switch (step) {
      case 0: return !!selected;
      case 1: return !!selected;
      case 2: return housing !== "";
      case 3: return evidenceType !== "";
      case 4: return name.trim() !== "" && /.+@.+\..+/.test(email);
      case 5: return serviceConsent;
      case 6: return true; // upload optional
      default: return true;
    }
  }, [step, selected, housing, evidenceType, name, email, serviceConsent]);

  async function submit() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("placeRef", selected.placeRef);
      fd.set("addressLine", selected.line1);
      fd.set("suburb", selected.suburb);
      fd.set("city", selected.city);
      fd.set("postcode", selected.postcode);
      fd.set("housingCategory", housing);
      fd.set("evidenceType", evidenceType);
      fd.set("contactName", name);
      fd.set("contactEmail", email);
      if (phone) fd.set("contactPhone", phone);
      fd.set("serviceConsent", String(serviceConsent));
      fd.set("marketingConsent", String(marketingConsent));
      if (file) fd.set("evidence", file);

      const res = await fetch("/api/eligibility/submit", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) return <ResultView result={result} />;

  return (
    <div className="min-h-screen">
      <div className="container-page py-8">
        <div className="flex items-center justify-between">
          <Wordmark />
          <Link href="/" className="text-sm text-ink-faint hover:text-ink">Exit</Link>
        </div>

        <div className="mx-auto mt-8 max-w-2xl">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-ink-faint">
              <span>Step {step + 1} of {STEPS.length}</span>
              <span>{STEPS[step]}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-brand-600 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
            </div>
          </div>

          <Card>
            {step === 0 && (
              <div>
                <h1 className="text-xl font-semibold text-ink">Check your address</h1>
                <p className="mt-1 text-sm text-ink-faint">Start typing your street. (Demo uses synthetic addresses — try “rimu”.)</p>
                <div className="mt-4 flex gap-2">
                  <input className="input" value={query} placeholder="e.g. 12 Rimu Lane"
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }} />
                  <button className="btn-primary" onClick={doSearch} disabled={query.trim().length < 3 || searching}>
                    {searching ? "Searching…" : "Search"}
                  </button>
                </div>
                <div className="mt-4 space-y-2">
                  {candidates.map((c) => (
                    <button key={c.placeRef} onClick={() => { setSelected(c); next(); }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left hover:bg-slate-50 ${selected?.placeRef === c.placeRef ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}>
                      <span>
                        <span className="font-medium text-ink">{c.line1}</span>
                        <span className="block text-xs text-ink-faint">{c.suburb}, {c.city} {c.postcode}</span>
                      </span>
                      <Pill tone={c.site.hasOnt ? "blue" : "slate"}>{c.site.hasOnt ? "Fibre box present" : "No fibre box"}</Pill>
                    </button>
                  ))}
                  {candidates.length === 0 && query.length >= 3 && !searching && (
                    <p className="text-sm text-ink-faint">No matches yet — press Search.</p>
                  )}
                </div>
              </div>
            )}

            {step === 1 && selected && availabilityVerdict && (
              <div>
                <h1 className="text-xl font-semibold text-ink">Availability result</h1>
                <p className="mt-1 text-sm text-ink-faint">{selected.line1}, {selected.suburb}</p>
                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                  <Pill tone={availabilityVerdict.tone}>{availabilityVerdict.label}</Pill>
                  <p className="mt-2 text-sm text-ink-soft">{availabilityVerdict.detail}</p>
                  <ul className="mt-3 space-y-1 text-sm text-ink-faint">
                    <li>Fibre box (ONT): {selected.site.hasOnt ? "Present" : "Not found"}</li>
                    <li>Last active: {selected.site.daysSinceLastActive === null ? "No record" : `${selected.site.daysSinceLastActive} days ago`}</li>
                  </ul>
                </div>
                <p className="mt-3 text-xs text-ink-faint">You can continue even if this looks uncertain — we’ll guide you.</p>
              </div>
            )}

            {step === 2 && (
              <FieldChoice title="Your household" hint="Which best describes your household? Final criteria are being confirmed."
                options={HOUSING_OPTIONS.map((o) => ({ ...o, badge: cfg && !cfg.enabledHousingCategories.includes(o.value) && o.value !== "none" ? "not in current launch scope" : undefined }))}
                value={housing} onChange={setHousing} />
            )}

            {step === 3 && (
              <FieldChoice title="Financial eligibility evidence" hint="Which approved evidence can you provide?"
                options={EVIDENCE_OPTIONS.map((o) => ({ ...o, badge: cfg && !cfg.enabledEvidenceTypes.includes(o.value) && o.value !== "none" ? "not accepted yet" : undefined }))}
                value={evidenceType} onChange={setEvidenceType} />
            )}

            {step === 4 && (
              <div>
                <h1 className="text-xl font-semibold text-ink">Your details</h1>
                <p className="mt-1 text-sm text-ink-faint">We use these to contact you about your application only.</p>
                <div className="mt-4 space-y-3">
                  <div><label className="label">Full name</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div><label className="label">Phone (optional)</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h1 className="text-xl font-semibold text-ink">Privacy & consent</h1>
                <p className="mt-1 text-sm text-ink-faint">We collect the minimum needed to check eligibility and connect you. Evidence is stored privately and access is logged.</p>
                <div className="mt-4 space-y-3">
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                    <input type="checkbox" checked={serviceConsent} onChange={(e) => setServiceConsent(e.target.checked)} className="mt-1" />
                    <span className="text-sm text-ink-soft"><strong className="text-ink">Required.</strong> I consent to {`${cfg?.plan.name ?? "Stride Broadband"}`} collecting and using my information to assess eligibility and provide the service. (Policy v1.0-demo)</span>
                  </label>
                  <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
                    <input type="checkbox" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} className="mt-1" />
                    <span className="text-sm text-ink-soft"><strong className="text-ink">Optional.</strong> Send me occasional updates. You’ll get the service either way — this is not required.</span>
                  </label>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h1 className="text-xl font-semibold text-ink">Upload evidence</h1>
                <p className="mt-1 text-sm text-ink-faint">Upload a clear photo or PDF of your evidence. PNG, JPEG or PDF, up to 8 MB. Stored privately — never shared publicly.</p>
                <input className="mt-4 block w-full text-sm" type="file" accept="image/png,image/jpeg,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                {file ? <p className="mt-2 text-sm text-emerald-700">Selected: {file.name}</p> : <p className="mt-2 text-xs text-ink-faint">Optional in the demo. If you skip it, you’ll be asked for more information.</p>}
                <p className="mt-3 text-xs text-ink-faint">We check completeness only. We can’t verify document authenticity automatically — that’s handled by an authorised process.</p>
              </div>
            )}

            {step === 7 && (
              <div>
                <h1 className="text-xl font-semibold text-ink">Review & submit</h1>
                <dl className="mt-4 divide-y divide-slate-100 text-sm">
                  <Row k="Address" v={`${selected?.line1}, ${selected?.suburb}`} />
                  <Row k="Household" v={HOUSING_OPTIONS.find((o) => o.value === housing)?.label ?? "—"} />
                  <Row k="Evidence" v={EVIDENCE_OPTIONS.find((o) => o.value === evidenceType)?.label ?? "—"} />
                  <Row k="Name" v={name} />
                  <Row k="Email" v={email} />
                  <Row k="Evidence file" v={file ? file.name : "Not provided"} />
                  <Row k="Marketing" v={marketingConsent ? "Opted in" : "No"} />
                </dl>
                {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
                <button className="btn-primary mt-5 w-full" onClick={submit} disabled={submitting}>
                  {submitting ? "Submitting…" : "Submit application"}
                </button>
              </div>
            )}

            {/* Nav */}
            {step < 7 && (
              <div className="mt-6 flex items-center justify-between">
                <button className="btn-ghost" onClick={back} disabled={step === 0}>Back</button>
                <button className="btn-primary" onClick={next} disabled={!canContinue}>Continue</button>
              </div>
            )}
            {step === 7 && (
              <div className="mt-3"><button className="btn-ghost" onClick={back}>Back</button></div>
            )}
          </Card>
          {error && step < 7 ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-ink-faint">{k}</dt>
      <dd className="text-right font-medium text-ink">{v}</dd>
    </div>
  );
}

function FieldChoice({ title, hint, options, value, onChange }: {
  title: string; hint: string;
  options: { value: string; label: string; badge?: string }[];
  value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-sm text-ink-faint">{hint}</p>
      <div className="mt-4 space-y-2">
        {options.map((o) => (
          <label key={o.value} className={`flex items-center justify-between gap-3 rounded-xl border p-3 cursor-pointer ${value === o.value ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:bg-slate-50"}`}>
            <span className="flex items-center gap-3">
              <input type="radio" name={title} checked={value === o.value} onChange={() => onChange(o.value)} />
              <span className="text-sm text-ink">{o.label}</span>
            </span>
            {o.badge ? <Pill tone="amber">{o.badge}</Pill> : null}
          </label>
        ))}
      </div>
    </div>
  );
}

function ResultView({ result }: { result: { reference: string; outcome: string; reason: string; results: { ruleCode: string; outcome: string; reason: string }[]; serviceOrderId: string | null } }) {
  const tone = result.outcome === "ELIGIBLE" ? "green" : result.outcome === "INELIGIBLE" ? "red" : "amber";
  const heading = result.outcome === "ELIGIBLE" ? "You’re likely eligible!" :
    result.outcome === "INELIGIBLE" ? "Not currently eligible" :
    result.outcome === "NEEDS_INFORMATION" ? "A little more information needed" : "We’ll review this for you";
  return (
    <div className="min-h-screen">
      <div className="container-page py-8">
        <Wordmark />
        <div className="mx-auto mt-8 max-w-2xl">
          <Card>
            <Pill tone={tone}>{result.outcome.replace(/_/g, " ").toLowerCase()}</Pill>
            <h1 className="mt-3 text-2xl font-bold text-ink">{heading}</h1>
            <p className="mt-2 text-sm text-ink-soft">{result.reason}</p>
            <p className="mt-2 text-sm text-ink-faint">Your reference is <strong className="text-ink">{result.reference}</strong>.</p>

            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <div className="text-sm font-semibold text-ink">How we assessed this</div>
              <ul className="mt-2 space-y-1.5 text-sm">
                {result.results.map((r) => (
                  <li key={r.ruleCode} className="flex items-start gap-2">
                    <Pill tone={r.outcome === "pass" ? "green" : r.outcome === "fail" ? "red" : "amber"}>{r.outcome}</Pill>
                    <span className="text-ink-soft">{r.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {result.outcome === "ELIGIBLE" && result.serviceOrderId ? (
                <Link href={`/checkout/${result.serviceOrderId}`} className="btn-primary">Continue to modem payment</Link>
              ) : null}
              <Link href="/support" className="btn-secondary">Ask the assistant</Link>
              <Link href="/" className="btn-ghost">Back to home</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
