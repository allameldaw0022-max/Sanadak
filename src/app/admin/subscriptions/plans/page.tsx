import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAdminSubscriptionPlans } from "@/lib/supabase/queries";
import { PlanManager } from "@/components/admin/PlanManager";

export const metadata: Metadata = {
  title: "خطط الاشتراك | سندك",
};

export default async function AdminSubscriptionPlansPage() {
  const plans = await getAdminSubscriptionPlans();

  return (
    <div>
      <Link
        href="/admin/subscriptions"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        الاشتراكات
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">خطط الاشتراك</h1>
        <p className="mt-1 text-sm text-slate-500">السعر والحد الأقصى للأجهزة قابلان للتعديل هنا مباشرة</p>
      </div>
      <PlanManager plans={plans} />
    </div>
  );
}
