import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CreditCard } from "lucide-react";
import { getCurrentUser, getDeveloperSubscription } from "@/lib/supabase/queries";
import { AddAppForm } from "@/components/developer/AddAppForm";

export const metadata: Metadata = {
  title: "إضافة تطبيق جديد | سندك",
};

function canAddApp(subscription: {
  status: string;
  expiresAt: string | null;
  maxApps: number | null;
  appCount: number;
}) {
  if (subscription.status === "suspended") return false;
  if (!subscription.expiresAt || new Date(subscription.expiresAt) < new Date()) return false;
  if (subscription.status !== "trial" && subscription.status !== "active") return false;
  if (subscription.maxApps === null) return true;
  return subscription.appCount < subscription.maxApps;
}

export default async function AddAppPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "developer") redirect("/developer/register");

  const subscription = await getDeveloperSubscription(user.id);

  if (!subscription || !canAddApp(subscription)) {
    const reason =
      subscription?.status === "suspended"
        ? "تم إيقاف اشتراكك، يرجى التواصل مع فريق سندك."
        : subscription?.maxApps !== null &&
            subscription &&
            subscription.appCount >= (subscription.maxApps ?? 0)
          ? "وصلت إلى الحد الأقصى لتطبيقات خطتك الحالية."
          : "لا يمكنك إضافة تطبيق جديد حاليًا — اشتراكك منتهٍ أو غير مفعّل.";

    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 py-16 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-600" />
        <h1 className="text-lg font-extrabold text-navy">تعذّرت إضافة تطبيق جديد</h1>
        <p className="max-w-sm text-sm text-slate-600">{reason}</p>
        <Link
          href="/developer/subscription"
          className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
        >
          <CreditCard className="h-4 w-4" />
          إدارة الاشتراك
        </Link>
      </div>
    );
  }

  return <AddAppForm />;
}
