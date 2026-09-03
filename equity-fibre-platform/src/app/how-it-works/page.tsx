import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Card } from "@/components/ui";
import { BRAND } from "@/lib/config/brand";
import { getBusinessConfig } from "@/lib/services/config";
import { formatNzd, modemContribution, monthlyPrice } from "@/lib/domain/pricing";

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const cfg = await getBusinessConfig();
  const price = monthlyPrice(cfg);
  const modem = modemContribution(cfg);
  const monthly = formatNzd(price.consumerPriceCents);

  const steps = [
    {
      n: 1,
      t: "Check your address",
      you: "Enter your street address so we can look it up.",
      us: "We check whether your home already has a Chorus fibre box (an ONT) and whether the fibre has been inactive long enough to qualify. You get a clear result in a couple of minutes — likely eligible, not currently eligible, or needs a closer look.",
    },
    {
      n: 2,
      t: "Confirm your eligibility",
      you: "Answer a few short questions about your household and choose the approved evidence you can provide.",
      us: "Our rules engine checks your answers against the approved criteria. Decisions are made by fixed rules — not guesswork — and every result comes with a plain-English reason. If anything is unclear, it goes to a person for review rather than being auto-declined.",
    },
    {
      n: 3,
      t: "Provide evidence",
      you: "Upload a clear photo or PDF of your approved low-income evidence (for example a Community Services Card or a MyMSD Benefit Breakdown Letter).",
      us: "Your document is stored privately and encrypted. Access is restricted to authorised staff and every view is logged. We check it is complete; authenticity is confirmed through an approved process — never by guessing.",
    },
    {
      n: 4,
      t: "Create your account & give consent",
      you: "Set up an account and agree to the collection and use of your information. Marketing messages are always optional and separate.",
      us: "We record your consent with a timestamp and the policy version. We only collect what we genuinely need to check eligibility and connect you.",
    },
    {
      n: 5,
      t: "Pay the one-off modem contribution",
      you: `Pay the upfront modem contribution of ${formatNzd(modem.customerContributionCents)}. The exact amount is shown before you confirm.`,
      us: "Payment is collected securely through a hosted checkout — we never see or store your card details. Your payment is confirmed by the provider before anything ships.",
    },
    {
      n: 6,
      t: "We assign and ship your modem",
      you: "Sit tight — you can track everything in your portal.",
      us: "We reserve a modem for you (each device is assigned to exactly one customer), record its details, and create a shipment. You can follow it through packed, shipped, and delivered.",
    },
    {
      n: 7,
      t: "We provision and activate your fibre",
      you: "Plug the modem into your fibre box using the guide we provide once your model is confirmed.",
      us: "We submit your service order for provisioning and handle any retries automatically if a step is delayed. Your service is only marked active once it is genuinely ready to use.",
    },
    {
      n: 8,
      t: "Monthly billing begins — only at activation",
      you: `From activation, you pay up to ${monthly} per month.`,
      us: "Billing starts when your fibre is activated, not when your modem is delivered. If a payment ever fails, you get a grace period — a single miss will not disconnect you.",
    },
  ];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-slate-50" />
        <div className="container-page py-14 sm:py-20">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-600/20">
            {BRAND.productName}
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">How Stride Broadband works</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-soft">
            From checking your address to getting connected — here is exactly what happens at each step, what you do, and what we do behind the scenes. Most of it is automated so we can keep the price low.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/eligibility" className="btn-primary px-5 py-3 text-base">Check your eligibility</Link>
            <Link href="/#faq" className="btn-secondary px-5 py-3 text-base">Read the FAQs</Link>
          </div>
        </div>
      </section>

      {/* Detailed steps */}
      <section className="container-page py-14">
        <h2 className="text-2xl font-bold text-ink">The journey, step by step</h2>
        <div className="mt-8 space-y-4">
          {steps.map((s) => (
            <Card key={s.n}>
              <div className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-base font-bold text-white">{s.n}</div>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{s.t}</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">What you do</div>
                      <p className="mt-1 text-sm text-ink-soft">{s.you}</p>
                    </div>
                    <div className="rounded-xl bg-brand-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-brand-700">What we do</div>
                      <p className="mt-1 text-sm text-ink-soft">{s.us}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Eligibility in depth */}
      <section className="container-page py-6">
        <h2 className="text-2xl font-bold text-ink">Who qualifies, and why</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">Stride Broadband is for households that can benefit most. To qualify, all of the following generally need to be true (final criteria are being confirmed with Chorus):</p>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card><div className="font-semibold text-ink">A fibre box is already installed</div><p className="mt-1 text-sm text-ink-faint">Your address needs an existing Chorus ONT (the small box on the wall). If there is no fibre box, the address is not eligible yet.</p></Card>
          <Card><div className="font-semibold text-ink">Fibre has been inactive for 3+ months</div><p className="mt-1 text-sm text-ink-faint">The plan is intended for homes that have not had an active fibre connection recently. This is checked against network records.</p></Card>
          <Card><div className="font-semibold text-ink">An approved household category</div><p className="mt-1 text-sm text-ink-faint">Such as public or community housing (a school-based pathway may be added later).</p></Card>
          <Card><div className="font-semibold text-ink">Approved low-income evidence</div><p className="mt-1 text-sm text-ink-faint">Such as a Community Services Card or a MyMSD Benefit Breakdown Letter.</p></Card>
        </div>
      </section>

      {/* Pricing in depth */}
      <section className="container-page py-14">
        <h2 className="text-2xl font-bold text-ink">What it costs</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <div className="font-semibold text-ink">Monthly plan</div>
            <div className="mt-2 flex items-baseline gap-1"><span className="text-3xl font-bold text-ink">{monthly}</span><span className="text-ink-faint">/ month</span></div>
            <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
              <li>{cfg.plan.downloadMbps} Mbps download / {cfg.plan.uploadMbps} Mbps upload</li>
              <li>Price includes GST</li>
              <li>Billing starts only at activation</li>
            </ul>
          </Card>
          <Card>
            <div className="font-semibold text-ink">One-off modem contribution</div>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-faint">Modem</dt><dd>{formatNzd(modem.purchaseCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">Shipping</dt><dd>{formatNzd(modem.shippingCents)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-faint">Chorus contribution</dt><dd>−{formatNzd(modem.chorusContributionCents)}</dd></div>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-semibold text-ink"><dt>You pay upfront</dt><dd>{formatNzd(modem.customerContributionCents)}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-ink-faint">Paid once, before your modem ships. The exact amount is always shown before you confirm.</p>
          </Card>
        </div>
      </section>

      {/* After you're connected */}
      <section className="container-page py-6">
        <h2 className="text-2xl font-bold text-ink">After you’re connected</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card><div className="font-semibold text-ink">Billing & payments</div><p className="mt-1 text-sm text-ink-faint">Manage your payment method, view invoices, and see your next payment date in your portal.</p></Card>
          <Card><div className="font-semibold text-ink">If money is tight</div><p className="mt-1 text-sm text-ink-faint">Tell us you’re having difficulty or dispute a charge, and we won’t automatically suspend your service while we help.</p></Card>
          <Card><div className="font-semibold text-ink">Support that’s there</div><p className="mt-1 text-sm text-ink-faint">Our assistant helps with setup and account questions, and a person steps in when it matters.</p></Card>
        </div>
      </section>

      {/* Privacy */}
      <section className="container-page py-14">
        <Card>
          <h2 className="text-xl font-semibold text-ink">Your privacy</h2>
          <p className="mt-2 text-sm text-ink-soft">
            We collect only what we need to check eligibility and provide the service. Eligibility evidence is stored privately with restricted, logged access and is never used for anything else. You can ask to access, correct, or delete your information from your account portal. Our privacy contact is {BRAND.privacyContact}.
          </p>
        </Card>
      </section>

      <section className="container-page pb-20">
        <div className="rounded-2xl bg-brand-600 px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-bold">Ready to see if you qualify?</h2>
          <p className="mx-auto mt-2 max-w-xl text-brand-50">It only takes a couple of minutes to check your address.</p>
          <Link href="/eligibility" className="btn mt-6 bg-white px-5 py-3 text-base font-semibold text-brand-700 hover:bg-brand-50">Check your eligibility</Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col items-start justify-between gap-3 py-8 text-sm text-ink-faint sm:flex-row">
          <div>© {new Date().getFullYear()} {BRAND.companyName}. {BRAND.productName}.</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/" className="hover:text-ink">Home</Link>
            <Link href="/support" className="hover:text-ink">Support</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
