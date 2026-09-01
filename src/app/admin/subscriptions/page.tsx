import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard, Landmark } from "lucide-react";
import { getAdminSubscriptionRequests, getAdminDealerUsage } from "@/lib/supabase/queries";
import { SubscriptionRequestReviewButtons } from "@/components/admin/SubscriptionRequestReviewButtons";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الاشتراكات | سندك",
};

export default async function AdminSubscriptionsPage() {
  const [pendingRequests, usage] = await Promise.all([
    getAdminSubscriptionRequests({ status: "pending" }),
    getAdminDealerUsage(),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">الاشتراكات</h1>
          <p className="mt-1 text-sm text-slate-500">طلبات اشتراك التجار واستهلاكهم للأجهزة</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/subscriptions/plans"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-navy hover:bg-slate-50"
          >
            <CreditCard className="h-4 w-4" />
            الخطط
          </Link>
          <Link
            href="/admin/subscriptions/payment-methods"
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-navy hover:bg-slate-50"
          >
            <Landmark className="h-4 w-4" />
            طرق الدفع
          </Link>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-bold text-navy">طلبات قيد المراجعة ({pendingRequests.length})</h2>
      <div className="mb-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {pendingRequests.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">لا توجد طلبات قيد المراجعة حاليًا.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">التاجر</th>
                  <th className="px-5 py-3 font-semibold">الخطة</th>
                  <th className="px-5 py-3 font-semibold">المبلغ</th>
                  <th className="px-5 py-3 font-semibold">إثبات الدفع</th>
                  <th className="px-5 py-3 font-semibold">التاريخ</th>
                  <th className="px-5 py-3 font-semibold">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-semibold text-navy">{r.dealerBusinessName || r.dealerEmail || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{r.planName}</td>
                    <td className="px-5 py-3 text-slate-600" dir="ltr">
                      {r.amountSdg.toLocaleString("ar-SD")} SDG
                    </td>
                    <td className="px-5 py-3">
                      {r.paymentProofSignedUrl ? (
                        <a
                          href={r.paymentProofSignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-primary hover:underline"
                        >
                          عرض
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3">
                      <SubscriptionRequestReviewButtons requestId={r.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <h2 className="mb-3 text-lg font-bold text-navy">استهلاك التجار ({usage.length})</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {usage.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-500">لا يوجد تجار مشتركون حاليًا.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">التاجر</th>
                  <th className="px-5 py-3 font-semibold">الخطة</th>
                  <th className="px-5 py-3 font-semibold">الاستخدام</th>
                  <th className="px-5 py-3 font-semibold">ينتهي في</th>
                  <th className="px-5 py-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {usage.map((u) => (
                  <tr key={u.dealerId} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-semibold text-navy">{u.dealerBusinessName || u.dealerEmail || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{u.planName}</td>
                    <td className="px-5 py-3 text-slate-600" dir="ltr">
                      {u.usedDevices} / {u.maxDevices}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(u.expiresAt)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          u.isCurrentlyActive ? "bg-primary-light text-primary-dark" : "bg-red-50 text-red-600"
                        )}
                      >
                        {u.isCurrentlyActive ? "فعال" : "منتهي"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
