import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubscriptionRequestForm } from "@/components/devices/SubscriptionRequestForm";
import { SubscriptionRequestStatusBadge } from "@/components/devices/SubscriptionRequestStatusBadge";
import { PlanStatusCard } from "@/components/devices/PlanStatusCard";
import { DealerProfileForm } from "@/components/devices/DealerProfileForm";
import {
  getCurrentUser,
  getActiveSubscriptionPlans,
  getActivePaymentMethods,
  getMyDealerSubscriptionStatus,
  getMySubscriptionRequests,
  getMyDealerProfile,
} from "@/lib/supabase/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "اشتراكي | سندك",
  robots: { index: false },
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

      {status ? (
        <PlanStatusCard status={status} />
      ) : (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-slate-300" />
            <div>
              <p className="text-sm font-bold text-navy">لا توجد باقة نشطة حاليًا</p>
              <p className="mt-0.5 text-sm text-slate-500">
                كل مستخدم يحصل تلقائيًا على 3 أجهزة مجانية بلا اشتراك. للحصول على حد أعلى، اشترك في إحدى خطط التاجر أدناه.
              </p>
            </div>
          </div>
        </div>
      )}

      <div id="subscribe-form" className="mb-8 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-extrabold text-navy">طلب اشتراك جديد</h2>
        {hasPendingRequest ? (
          <p className="text-sm text-amber-700">لديك طلب اشتراك قيد المراجعة حاليًا. سيصلك إشعار فور البت فيه.</p>
        ) : (
          <SubscriptionRequestForm
            plans={plans}
            paymentMethods={paymentMethods}
            currentPlanId={status?.planId}
            hasActiveSubscription={!!status?.isCurrentlyActive}
          />
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
                <p className="mt-1 text-xs text-slate-500">
                  <span dir="ltr">{r.amountSdg.toLocaleString("ar-SD")} SDG</span> — حتى {r.maxDevicesSnapshot} جهاز —{" "}
                  {formatDate(r.createdAt)}
                </p>
                {r.status === "rejected" && (
                  <div className="mt-2">
                    {r.rejectionReason && <p className="text-xs text-red-600">سبب الرفض: {r.rejectionReason}</p>}
                    <Link
                      href="#subscribe-form"
                      className="mt-1.5 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      أعد المحاولة
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
