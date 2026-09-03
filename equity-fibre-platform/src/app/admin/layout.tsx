import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasCapability, type Capability } from "@/lib/auth/rbac";
import { Wordmark } from "@/components/Brand";
import { Pill } from "@/components/ui";

const NAV: { href: string; label: string; cap: Capability }[] = [
  { href: "/admin", label: "Dashboard", cap: "dashboard.view" },
  { href: "/admin/applications", label: "Applications", cap: "applications.review" },
  { href: "/admin/provisioning", label: "Provisioning", cap: "provisioning.operate" },
  { href: "/admin/inventory", label: "Modem inventory", cap: "inventory.manage" },
  { href: "/admin/payments", label: "Payments", cap: "payments.view" },
  { href: "/admin/hardship", label: "Hardship & holds", cap: "hardship.handle" },
  { href: "/admin/support", label: "Support", cap: "support.handle" },
  { href: "/admin/config", label: "Configuration", cap: "config.view" },
  { href: "/admin/metrics", label: "Metrics", cap: "dashboard.view" },
  { href: "/admin/audit", label: "Audit log", cap: "audit.view" },
  { href: "/admin/demo", label: "Demo controls", cap: "demo.control" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.isStaff) redirect("/portal");

  const links = NAV.filter((n) => hasCapability(user.roles, n.cap));

  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Wordmark href="/admin" />
            <Pill tone="slate">Staff console</Pill>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="hidden text-right sm:block">
              <div className="font-medium text-ink">{user.displayName}</div>
              <div className="text-xs text-ink-faint">{user.roles.join(", ") || "—"}</div>
            </div>
            <form action="/api/auth/logout" method="post"><button className="btn-ghost">Sign out</button></form>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-6 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="flex flex-wrap gap-1.5 lg:flex-col">
            {links.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-white hover:text-ink">
                {n.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
