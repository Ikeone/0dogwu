import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import { Card, Pill, StatusPill, EmptyState } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatNzd } from "@/lib/domain/pricing";

export default async function PortalPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.isStaff) redirect("/admin");

  // OWNERSHIP: every query is scoped to the authenticated user's id.
  const application = await prisma.eligibilityApplication.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      address: true,
      serviceOrder: {
        include: {
          assignment: { include: { device: { include: { model: true } } } },
          shipment: { include: { events: { orderBy: { createdAt: "asc" } } } },
          subscription: true,
          provisioning: { include: { events: { orderBy: { createdAt: "asc" } } } },
          transactions: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  const notifications = await prisma.customerNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const order = application?.serviceOrder;
  const sub = order?.subscription;

  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Wordmark href="/portal" />
          <div className="flex items-center gap-3 text-sm">
            <span className="text-ink-faint">Signed in as {user.displayName}</span>
            <form action="/api/auth/logout" method="post"><button className="btn-ghost">Sign out</button></form>
          </div>
        </div>
      </div>

      <div className="container-page py-8">
        <h1 className="text-2xl font-bold text-ink">Your Equity Fibre</h1>
        <p className="mt-1 text-ink-faint">Track your application, modem, and connection.</p>

        {!application ? (
          <div className="mt-6"><EmptyState title="No application yet" hint="Check your eligibility to get started." /><Link href="/eligibility" className="btn-primary mt-4">Check eligibility</Link></div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Left: journey */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-ink-faint">Application {application.reference}</div>
                    <div className="mt-1 text-lg font-semibold text-ink">{application.address.line1}, {application.address.suburb}</div>
                  </div>
                  <StatusPill status={application.status} />
                </div>

                {order ? (
                  <div className="mt-5">
                    <Timeline order={order} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-ink-soft">
                    {application.status === "NEEDS_INFORMATION" && "We need a little more information to continue. Please contact support to provide your evidence."}
                    {application.status === "MANUAL_REVIEW" && "Your application is being reviewed by our team. We’ll be in touch."}
                    {application.status === "INELIGIBLE" && "Unfortunately this address isn’t eligible right now. See the assistant for details."}
                  </p>
                )}
              </Card>

              {order?.assignment ? (
                <Card>
                  <div className="text-sm font-semibold text-ink">Your modem</div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <Detail k="Model" v={`${order.assignment.device.model.manufacturer} ${order.assignment.device.model.model}`} />
                    <Detail k="Status" v={<StatusPill status={order.assignment.device.status} />} />
                    <Detail k="Shipment" v={order.shipment ? <StatusPill status={order.shipment.status} /> : "—"} />
                    <Detail k="Tracking" v={order.shipment?.trackingRef ?? "—"} />
                  </dl>
                  <p className="mt-3 text-xs text-ink-faint">Need help setting it up? Ask the assistant for a step-by-step guide.</p>
                  <Link href="/support" className="btn-secondary mt-3">Modem setup help</Link>
                </Card>
              ) : null}
            </div>

            {/* Right: billing + support */}
            <div className="space-y-6">
              <Card>
                <div className="text-sm font-semibold text-ink">Billing</div>
                {sub && sub.status !== "NOT_CREATED" ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-ink-faint">Plan</span><span>{formatNzd(sub.monthlyPriceCents)}/mo</span></div>
                    <div className="flex justify-between"><span className="text-ink-faint">Status</span><StatusPill status={sub.status} /></div>
                    <div className="flex justify-between"><span className="text-ink-faint">Next payment</span><span>{sub.nextBillingAt ? sub.nextBillingAt.toLocaleDateString("en-NZ") : "—"}</span></div>
                    {sub.status === "GRACE_PERIOD" ? (
                      <div className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">A payment didn’t go through. You’re in a grace period — please update your payment method. Your service stays on.</div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-ink-faint">Monthly billing starts once your fibre is activated.</p>
                )}
              </Card>

              <Card>
                <div className="text-sm font-semibold text-ink">Messages</div>
                {notifications.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-faint">No messages yet.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {notifications.map((n) => (
                      <li key={n.id} className="rounded-lg border border-slate-100 p-2.5">
                        <div className="font-medium text-ink">{n.subject}</div>
                        <div className="text-xs text-ink-faint">{n.createdAt.toLocaleString("en-NZ")}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <div className="text-sm font-semibold text-ink">Help & privacy</div>
                <div className="mt-3 space-y-2">
                  <Link href="/support" className="btn-secondary w-full">Ask the assistant</Link>
                  <Link href="/portal/privacy" className="btn-ghost w-full">Privacy & data requests</Link>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><dt className="text-ink-faint">{k}</dt><dd className="mt-0.5 font-medium text-ink">{v}</dd></div>;
}

/** Simple vertical progress timeline derived from the order state. */
function Timeline({ order }: { order: { status: string; shipment: { status: string } | null; subscription: { status: string } | null; provisioning: { status: string } | null } }) {
  const steps = [
    { key: "payment", label: "Modem payment", done: order.status !== "AWAITING_MODEM_PAYMENT" && order.status !== "CREATED" },
    { key: "assigned", label: "Modem assigned", done: ["MODEM_PAYMENT_CONFIRMED", "READY_FOR_PROVISIONING", "PROVISIONING_REQUESTED", "PROVISIONING_IN_PROGRESS", "PROVISIONING_BLOCKED", "READY_FOR_ACTIVATION", "ACTIVE"].includes(order.status) },
    { key: "shipped", label: "Modem shipped", done: order.shipment?.status === "SHIPPED" || order.shipment?.status === "DELIVERED" },
    { key: "delivered", label: "Modem delivered", done: order.shipment?.status === "DELIVERED" },
    { key: "provisioned", label: "Fibre provisioned", done: order.provisioning?.status === "COMPLETED" || order.status === "READY_FOR_ACTIVATION" || order.status === "ACTIVE" },
    { key: "active", label: "Service active", done: order.status === "ACTIVE" },
  ];
  const currentIdx = steps.findIndex((s) => !s.done);
  return (
    <ol className="relative space-y-4">
      {steps.map((s, i) => {
        const state = s.done ? "done" : i === currentIdx ? "current" : "todo";
        return (
          <li key={s.key} className="flex items-center gap-3">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${state === "done" ? "bg-emerald-500 text-white" : state === "current" ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"}`}>
              {state === "done" ? "✓" : i + 1}
            </span>
            <span className={`text-sm ${state === "todo" ? "text-ink-faint" : "text-ink"}`}>{s.label}</span>
            {state === "current" ? <Pill tone="blue">in progress</Pill> : null}
          </li>
        );
      })}
    </ol>
  );
}
