import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/lib/config/brand";

export const metadata: Metadata = {
  title: `${BRAND.productName} — ${BRAND.tagline}`,
  description: `${BRAND.productName} by ${BRAND.companyName}: affordable fibre broadband for eligible households.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ">
      <body>
        {children}
      </body>
    </html>
  );
}
