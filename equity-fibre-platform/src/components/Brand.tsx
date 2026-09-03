import Link from "next/link";
import { BRAND } from "@/lib/config/brand";

/** Text-based wordmark placeholder. Replace with a logo from brand config. */
export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-bold text-ink">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">SB</span>
      <span className="text-lg tracking-tight">{BRAND.wordmark}</span>
    </Link>
  );
}
