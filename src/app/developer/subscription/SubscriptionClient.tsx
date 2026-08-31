"use client";

import { useState } from "react";
import { Clock, XCircle } from "lucide-react";
import { SubscriptionStatusCard } from "@/components/developer/SubscriptionStatusCard";
import { PlanCard } from "@/components/developer/PlanCard";
import { PaymentRequestForm } from "@/components/developer/PaymentRequestForm";
import { paymentStatusLabels, paymentStatusStyles } from "@/lib/subscription";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type {
  DeveloperSubscription,
  PaymentSettings,
  PaymentRequestSummary,
} from "@/lib/supabase/queries";

export function SubscriptionClient({
  developerId,
  subscription,
  settings,
  history,
}: {
  developerId: string;
  subscription: DeveloperSubscription;
  settings: PaymentSettings | null;
  history: PaymentRequestSummary[];
}) {
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro" | null>(null);

  const hasPendingPayment = !!subscription.pendingPaymentRequest;
  const paymentNotConfigured = !settings || settings.usdToSdgRate <= 0;

  return (
    <div className="space-y-6">
      <SubscriptionStatusCard subscription={subscription} />

      {hasPendingPayment ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <Clock className="mx-auto h-8 w-8 text-amber-600" />
          <p className="mt-2 text-sm font-bold text-amber-800">🟠 طلب دفع بانتظار المراجعة</p>
          <p className="mt-1 text-xs text-amber-700">
            سيراجع فريق سندك طلبك ويقوم بتفعيل الاشتراك بعد التأكد من التحويل البنكي.
          </p>
        </div>
      ) : selectedPlan && settings ? (
        <PaymentRequestForm
          plan={selectedPlan}
          developerId={developerId}
          settings={settings}
          onCancel={() => setSelectedPlan(null)}
        />
      ) : (
        <div>
          <h2 className="mb-1 text-lg font-bold text-navy">اختر خطتك</h2>
          <p className="mb-4 text-sm text-slate-500">
            الدفع حاليًا عبر التحويل البنكي فقط. بعد إرسال إشعار التحويل يراجعه فريق سندك ويفعّل اشتراكك.
          </p>

          {paymentNotConfigured && (
            <p className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
              <XCircle className="h-4 w-4 shrink-0" />
              نظام الدفع غير مُعد بعد من الإدارة، يرجى المحاولة لاحقًا.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PlanCard
              plan="basic"
              priceUsd={settings?.basicPriceUsd ?? 10}
              limitLabel={`حتى ${settings?.basicMaxApps ?? 20} تطبيقًا`}
              features={[
                `حتى ${settings?.basicMaxApps ?? 20} تطبيقًا`,
                "مراجعة ونشر عادي",
                "دعم عبر لوحة التحكم",
              ]}
              isCurrent={subscription.plan === "basic" && subscription.status === "active"}
              disabled={paymentNotConfigured}
              onSelect={() => setSelectedPlan("basic")}
            />
            <PlanCard
              plan="pro"
              priceUsd={settings?.proPriceUsd ?? 20}
              limitLabel="تطبيقات غير محدودة"
              features={[
                "عدد غير محدود من التطبيقات",
                "وفق سياسة الاستخدام العادل",
                "أولوية في الدعم",
              ]}
              highlighted
              isCurrent={subscription.plan === "pro" && subscription.status === "active"}
              disabled={paymentNotConfigured}
              onSelect={() => setSelectedPlan("pro")}
            />
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-bold text-navy">سجل طلبات الدفع</h2>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-bold text-navy">
                    {h.plan === "basic" ? "الخطة الأساسية" : "الخطة الاحترافية"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(h.createdAt)} · {h.amountSdg.toLocaleString("en-US")} SDG
                  </p>
                  {h.status === "rejected" && h.adminNote && (
                    <p className="mt-1 text-xs text-red-600">سبب الرفض: {h.adminNote}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    paymentStatusStyles[h.status]
                  )}
                >
                  {paymentStatusLabels[h.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
