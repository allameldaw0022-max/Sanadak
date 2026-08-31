import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPaymentSettings } from "@/lib/supabase/queries";
import { PaymentSettingsForm } from "@/components/admin/PaymentSettingsForm";

export const metadata: Metadata = {
  title: "إعدادات الدفع | سندك",
};

export default async function AdminPaymentSettingsPage() {
  const settings = await getPaymentSettings();

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/settings"
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        العودة للإعدادات
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">إعدادات الدفع</h1>
        <p className="mt-1 text-sm text-slate-500">
          بيانات الحساب البنكي، سعر الصرف، وأسعار خطط الاشتراك
        </p>
      </div>

      {settings ? (
        <PaymentSettingsForm settings={settings} />
      ) : (
        <p className="text-sm text-slate-500">تعذر تحميل إعدادات الدفع.</p>
      )}
    </div>
  );
}
