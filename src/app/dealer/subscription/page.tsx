import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard, Smartphone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubscriptionRequestForm } from "@/components/devices/SubscriptionRequestForm";
import { SubscriptionRequestStatusBadge } from "@/components/devices/SubscriptionRequestStatusBadge";
import { DealerProfileForm } from "@/components/devices/DealerProfileForm";
import {
  getCurrentUser,
  getActiveSubscriptionPlans,
  getActivePaymentMethods,
  getMyDealerSubscriptionStatus,
  getMySubscriptionRequests,
  getMyDealerProfile,
} from "@/lib/supabase/queries";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "اشتراكي | سندك",
};

// Open to any signed-in user, not just existing dealers -- becoming a
// dealer happens automatically the moment an admin approves a subscription
// request (see review_subscription_request), so a regular user hitting the
// free-tier device limit needs to be able to land here and subscribe, not
// just an already-approved dealer renewing.
export default async function DealerSubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [plans, paymentMethods, status, requests, dealerProfile] = await Promise.all([
    getActiveSubscriptionPlans(),
    getActivePaymentMethods(),
    getMyDealerSubscriptionStatus(user.id),
    getMySubscriptionRequests(user.id),
    getMyDealerProfile(user.id),
  ]);

  const hasPendingRequest = requests.some((r) => r.status === "pending");

  return (
    <Container className="py-8 sm:py-12">
      <SectionHeader title="اشتراكي" subtitle="إدارة اشتراك حسابك التجاري وحد الأجهزة المسموح به" />

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {status ? (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-extrabold text-navy">{status.planName}</p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                  status.isCurrentlyActive ? "bg-primary-light text-primary-dark" : "bg-red-50 text-red-600"
                )}
              >
                {status.isCurrentlyActive ? "فعال" : "منتهي"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <Smartphone className="h-4 w-4" />
              الاستخدام: {status.usedDevices} / {status.maxDevices} جهاز
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn("h-full rounded-full", status.usedDevices >= status.maxDevices ? "bg-red-500" : "bg-primary")}
                style={{ width: `${Math.min(100, (status.usedDevices / Math.max(1, status.maxDevices)) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-slate-500">ينتهي الاشتراك في {formatDate(status.expiresAt)}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-slate-300" />
            <div>
              <p className="text-sm font-bold text-navy">لا توجد باقة نشطة حاليًا</p>
              <p className="mt-0.5 text-sm text-slate-500">
                كل مستخدم يحصل تلقائيًا على 3 أجهزة مجانية بلا اشتراك. للحصول على حد أعلى، اشترك في إحدى خطط التاجر أدناه.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-navy">طلب اشتراك جديد</h2>
        {hasPendingRequest ? (
          <p className="text-sm text-amber-700">لديك طلب اشتراك قيد المراجعة حاليًا. سيصلك إشعار فور البت فيه.</p>
        ) : (
          <SubscriptionRequestForm plans={plans} paymentMethods={paymentMethods} currentPlanId={status?.planId} />
        )}
      </div>

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-navy">بيانات النشاط التجاري</h2>
        <DealerProfileForm
          initial={
            dealerProfile ?? { businessName: null, contactName: null, phone: null, address: null, logoSignedUrl: null }
          }
        />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-extrabold text-navy">سجل الطلبات</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد طلبات اشتراك سابقة.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-navy">{r.planName}</p>
                  <SubscriptionRequestStatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-xs text-slate-500" dir="ltr">
                  {r.amountSdg.toLocaleString("ar-SD")} SDG — {formatDate(r.createdAt)}
                </p>
                {r.status === "rejected" && r.rejectionReason && (
                  <p className="mt-2 text-xs text-red-600">سبب الرفض: {r.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
