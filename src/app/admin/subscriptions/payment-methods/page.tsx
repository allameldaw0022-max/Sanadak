import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAdminPaymentMethods } from "@/lib/supabase/queries";
import { PaymentMethodManager } from "@/components/admin/PaymentMethodManager";

export const metadata: Metadata = {
  title: "طرق الدفع | سندك",
};

export default async function AdminPaymentMethodsPage() {
  const methods = await getAdminPaymentMethods();

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
        <h1 className="text-2xl font-extrabold text-navy">طرق الدفع</h1>
        <p className="mt-1 text-sm text-slate-500">بيانات الحسابات البنكية التي تظهر للتجار عند الاشتراك</p>
      </div>
      <PaymentMethodManager methods={methods} />
    </div>
  );
}
