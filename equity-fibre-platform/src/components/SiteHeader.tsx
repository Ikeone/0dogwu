import Link from "next/link";
import { Wordmark } from "./Brand";
import { getSessionUser } from "@/lib/auth/session";

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Wordmark />
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-soft sm:flex">
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#faq" className="hover:text-ink">FAQ</Link>
          <Link href="/support" className="hover:text-ink">Support</Link>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={user.isStaff ? "/admin" : "/portal"} className="btn-secondary">
                {user.isStaff ? "Staff console" : "My portal"}
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="btn-ghost" type="submit">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Sign in</Link>
              <Link href="/eligibility" className="btn-primary">Check eligibility</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
