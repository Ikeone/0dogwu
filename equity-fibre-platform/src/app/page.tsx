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

  const modemAmount = formatNzd(modem.customerContributionCents);
  const monthly = formatNzd(price.consumerPriceCents);

  const faqs = [
    { q: "What is Stride Broadband?", a: `Stride Broadband is a low-cost home fibre plan for eligible households — ${cfg.plan.downloadMbps} Mbps download and ${cfg.plan.uploadMbps} Mbps upload for up to ${monthly} per month. It uses the fibre already installed at your address.` },
    { q: "Is it free?", a: `No. It is a low-cost plan — up to ${monthly} per month — plus a one-off upfront modem contribution. It is not a free service.` },
    { q: "Who can apply?", a: "Homes that already have a Chorus fibre box (ONT) that has been inactive for at least three months, that meet an approved household category (such as public or community housing), and that can provide approved low-income evidence. The exact launch criteria are being confirmed with Chorus." },
    { q: "What evidence do I need?", a: "Approved low-income evidence such as a Community Services Card or a MyMSD Benefit Breakdown Letter. You upload a clear photo or PDF; it is stored privately and only used to check your eligibility." },
    { q: "How much does it cost each month?", a: `Up to ${monthly} per month (this working figure includes GST). We always show the exact amount before you confirm anything.` },
    { q: "What is the upfront modem contribution?", a: `A one-off amount of ${modemAmount} that covers part of your managed modem and shipping. You pay it once, before your modem is shipped. The exact figure is shown before you pay.` },
    { q: "When does monthly billing start?", a: "Monthly billing begins only once your fibre service is activated — not when your modem is delivered. You will not be billed monthly before you are connected." },
    { q: "What happens if I can't pay one month?", a: "A single missed monthly payment does not disconnect you. You get a grace period to update your payment method, and you can tell us if you are experiencing hardship so we can help. We will not automatically suspend a service while a hardship or dispute case is open." },
    { q: "Can I use my own modem?", a: "For launch, the plan uses the managed modem we supply so we can support you reliably. Bring-your-own-modem may be considered later." },
    { q: "How long does it take to get connected?", a: "After you are approved and your upfront payment succeeds, we assign and ship a modem, then arrange provisioning and activation. You can track every step in your account portal." },
    { q: "What speeds do I get?", a: `${cfg.plan.downloadMbps} Mbps download and ${cfg.plan.uploadMbps} Mbps upload. Real-world speeds can vary with your home setup and the number of devices connected.` },
    { q: "How is my personal information handled?", a: "We collect only what we need to check eligibility and provide the service. Eligibility evidence is stored privately with restricted, logged access. You can ask to access, correct, or delete your information from your account portal." },
    { q: "How do I cancel?", a: "You can request cancellation from your account portal or by contacting support. Any equipment return and applicable terms are explained at that time." },
    { q: "How do I get help?", a: "Our assistant can answer setup, eligibility, and billing questions, and a person steps in when it matters. You can also raise a support ticket from your account." },
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
            <div className="mt-1 text-xs text-ink-faint">Price includes GST.</div>
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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-ink">How it works</h2>
            <p className="mt-2 max-w-2xl text-ink-soft">A simple, guided process — most of it automated so we can keep costs low.</p>
          </div>
          <Link href="/how-it-works" className="btn-secondary">See how it works in detail →</Link>
        </div>
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

      {/* FAQ — expandable dropdowns */}
      <section id="faq" className="container-page py-16">
        <h2 className="text-2xl font-bold text-ink">Frequently asked questions</h2>
        <p className="mt-2 text-ink-soft">Tap a question to see the answer.</p>
        <div className="mt-6 space-y-2.5">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white shadow-card">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink">
                <span>{f.q}</span>
                <span className="text-brand-600 transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="border-t border-slate-100 px-5 py-4 text-sm text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-6">
          <Link href="/support" className="btn-secondary">Still have a question? Ask us</Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-8 text-sm text-ink-faint sm:flex-row">
          <div>© {new Date().getFullYear()} {BRAND.companyName}. {BRAND.productName}.</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/how-it-works" className="hover:text-ink">How it works</Link>
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
