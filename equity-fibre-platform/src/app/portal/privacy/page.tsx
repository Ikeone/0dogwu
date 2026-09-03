import { redirect } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import { Card } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { PrivacyForm } from "./PrivacyForm";
import { BRAND } from "@/lib/config/brand";

export default async function PortalPrivacyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <div className="container-page py-8">
        <div className="flex items-center justify-between">
          <Wordmark href="/portal" />
          <Link href="/portal" className="text-sm text-ink-faint hover:text-ink">Back to portal</Link>
        </div>
        <div className="mx-auto mt-6 max-w-xl">
          <Card>
            <h1 className="text-xl font-semibold text-ink">Privacy & your data</h1>
            <p className="mt-1 text-sm text-ink-soft">
              You can ask to access or correct your information, or request deletion (subject to legal obligations
              such as financial record-keeping). Our privacy contact is {BRAND.privacyContact}.
            </p>
            <PrivacyForm />
          </Card>
          <p className="mt-3 text-xs text-ink-faint">We record your request and handle it under our privacy policy. See the assistant for more on how your data is used.</p>
        </div>
      </div>
    </div>
  );
}
