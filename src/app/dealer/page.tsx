import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { getCurrentUser } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ImeiCheckForm } from "@/components/devices/ImeiCheckForm";
import { BatchImeiCheckForm } from "@/components/devices/BatchImeiCheckForm";

export const metadata: Metadata = {
  title: "لوحة التاجر | سندك",
};

// Dealer is a business-entity flag on the existing profile row (is_dealer),
// not a new role or auth system -- a dealer keeps whatever role they
// already have and gets access to exactly this one page, which only
// surfaces the same single/batch IMEI-check tools available elsewhere in
// the app (public_check_device_status under the hood, unchanged). No
// device-status, owner, or evidence data is exposed here beyond what those
// existing safe-disclosure endpoints already return.
export default async function DealerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isDealer) redirect("/");

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-2 flex items-center gap-2">
        <Store className="h-5 w-5 text-primary-dark" />
        <span className="text-xs font-bold text-primary-dark">حساب تاجر</span>
      </div>
      <SectionHeader title="لوحة التاجر" subtitle="فحص أرقام IMEI فرديًا أو دفعة واحدة" />

      <div className="space-y-6">
        <ImeiCheckForm />
        <BatchImeiCheckForm />
      </div>
    </Container>
  );
}
