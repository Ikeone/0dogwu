import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui";
import { BRAND } from "@/lib/config/brand";
import { getBusinessConfig } from "@/lib/services/config";
import { formatNzd, modemContribution, monthlyPrice } from "@/lib/domain/pricing";

// Reads runtime business config + auth state; render on demand (not at build).
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const cfg = await getBusinessConfig();
  const price = monthlyPrice(cfg);
  const modem = modemContribution(cfg);

  const steps = [
    { n: 1, t: "Check your address", d: "See if your home qualifies in a couple of minutes." },
    { n: 2, t: "Confirm eligibility", d: "Answer a few questions and upload approved evidence." },
    { n: 3, t: "Pay the modem contribution", d: "A one-off upfront amount, shown before you pay." },
    { n: 4, t: "Get connected", d: "We ship your modem and activate your fibre." },
  ];

  const faqs = [
    { q: "Is this free?", a: "No. Stride Broadband is a low-cost plan — up to $30 per month — for eligible households, plus a one-off upfront modem contribution." },
    { q: "Who can apply?", a: "Homes that already have a Chorus fibre box (ONT) that has been inactive for at least three months, and that meet an approved household category with approved low-income evidence. Final criteria are being confirmed." },
    { q: "When does billing start?", a: "Monthly billing begins only once your fibre service is activated — not when your modem is delivered." },
    { q: "What if a payment fails?", a: "A single failed monthly payment does not disconnect you. You get a grace period to update your payment method." },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-slate-50" />
        <div className="container-page grid gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-600/20">
              {BRAND.companyName} · {BRAND.productName}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Affordable fibre for eligible households
            </h1>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">
              Reliable home internet at a price that works for your whānau. {cfg.plan.downloadMbps} Mbps download,
              {" "}{cfg.plan.uploadMbps} Mbps upload, for up to {formatNzd(price.consumerPriceCents)} per month.
              Eligibility conditions apply and an upfront modem contribution may apply.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/eligibility" className="btn-primary px-5 py-3 text-base">Check your eligibility</Link>
              <Link href="/support" className="btn-secondary px-5 py-3 text-base">Ask a question</Link>
            </div>
            <p className="mt-4 text-sm text-ink-faint">
              Your information is handled with care. We only collect what we need to check eligibility and connect you.
            </p>
          </div>

          <Card className="lg:justify-self-end lg:max-w-md">
            <div className="text-sm font-semibold text-ink-faint">{cfg.plan.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-ink">{formatNzd(price.consumerPriceCents)}</span>
              <span className="text-ink-faint">/ month</span>
            </div>
            <div className="mt-1 text-xs text-ink-faint">Working assumption: price includes GST.</div>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              <li className="flex items-center gap-2"><Dot /> {cfg.plan.downloadMbps} Mbps download / {cfg.plan.uploadMbps} Mbps upload</li>
              <li className="flex items-center gap-2"><Dot /> Managed modem included</li>
              <li className="flex items-center gap-2"><Dot /> One-off upfront modem contribution: {formatNzd(modem.customerContributionCents)}</li>
              <li className="flex items-center gap-2"><Dot /> Billing starts at activation, not delivery</li>
            </ul>
            <Link href="/eligibility" className="btn-primary mt-6 w-full">Get started</Link>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container-page py-16">
        <h2 className="text-2xl font-bold text-ink">How it works</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">A simple, guided process — most of it automated so we can keep costs low.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.n}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">{s.n}</div>
              <div className="mt-3 font-semibold text-ink">{s.t}</div>
              <div className="mt-1 text-sm text-ink-faint">{s.d}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Reassurance */}
      <section className="container-page pb-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><div className="font-semibold text-ink">Privacy first</div><p className="mt-1 text-sm text-ink-faint">We collect the minimum needed. Evidence is stored privately and access is logged.</p></Card>
          <Card><div className="font-semibold text-ink">Clear pricing</div><p className="mt-1 text-sm text-ink-faint">We show the exact one-off and monthly amounts before you confirm anything.</p></Card>
          <Card><div className="font-semibold text-ink">Real support</div><p className="mt-1 text-sm text-ink-faint">An assistant helps with setup, and a person steps in when it matters.</p></Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container-page py-16">
        <h2 className="text-2xl font-bold text-ink">Frequently asked questions</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {faqs.map((f) => (
            <Card key={f.q}>
              <div className="font-semibold text-ink">{f.q}</div>
              <p className="mt-2 text-sm text-ink-soft">{f.a}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-8 text-sm text-ink-faint sm:flex-row">
          <div>© {new Date().getFullYear()} {BRAND.companyName} (demo). Not a live service.</div>
          <div className="flex gap-4">
            <Link href="/support" className="hover:text-ink">Support</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <span>Privacy: {BRAND.privacyContact}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-600" aria-hidden />;
}
