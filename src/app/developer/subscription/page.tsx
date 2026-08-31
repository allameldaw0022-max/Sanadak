import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getDeveloperSubscription,
  getPaymentSettings,
  getDeveloperPaymentRequests,
} from "@/lib/supabase/queries";
import { SubscriptionClient } from "./SubscriptionClient";

export const metadata: Metadata = {
  title: "الاشتراك والدفع | سندك",
};

export default async function DeveloperSubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "developer") redirect("/developer/register");

  const [subscription, settings, history] = await Promise.all([
    getDeveloperSubscription(user.id),
    getPaymentSettings(),
    getDeveloperPaymentRequests(user.id),
  ]);

  if (!subscription) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-navy">الاشتراك والدفع</h1>
        <p className="mt-4 text-sm text-slate-500">
          تعذر تحميل بيانات اشتراكك، حاول تحديث الصفحة أو تواصل مع الدعم.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">الاشتراك والدفع</h1>
        <p className="mt-1 text-sm text-slate-500">تابع حالة اشتراكك وخطتك الحالية</p>
      </div>

      <SubscriptionClient
        developerId={user.id}
        subscription={subscription}
        settings={settings}
        history={history}
      />
    </div>
  );
}
