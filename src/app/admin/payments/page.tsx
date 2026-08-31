import type { Metadata } from "next";
import Link from "next/link";
import { Clock, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { StatsCard } from "@/components/developer/StatsCard";
import { getAdminPaymentRequests, getAdminPaymentStats } from "@/lib/supabase/queries";
import { formatDate, cn } from "@/lib/utils";
import { paymentStatusLabels, paymentStatusStyles, planPickLabels } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "المدفوعات | سندك",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const [requests, stats] = await Promise.all([getAdminPaymentRequests(), getAdminPaymentStats()]);
  const filtered = status === "all" ? requests : requests.filter((r) => r.status === status);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">المدفوعات</h1>
        <p className="mt-1 text-sm text-slate-500">طلبات دفع الاشتراكات والإيرادات</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatsCard label="بانتظار المراجعة" value={stats.pendingCount} icon={Clock} color="#B45309" />
        <StatsCard label="مقبولة" value={stats.approvedCount} icon={CheckCircle2} color="#16A34A" />
        <StatsCard label="مرفوضة" value={stats.rejectedCount} icon={XCircle} color="#DC2626" />
        <StatsCard
          label="إيرادات هذا الشهر"
          value={`$${stats.revenueThisMonthUsd.toLocaleString("en-US")}`}
          icon={DollarSign}
          color="#0EA5E9"
        />
        <StatsCard
          label="إيرادات هذه السنة"
          value={`$${stats.revenueThisYearUsd.toLocaleString("en-US")}`}
          icon={DollarSign}
          color="#7C3AED"
        />
      </div>

      <div className="no-scrollbar mt-6 mb-5 flex gap-2 overflow-x-auto">
        {["all", "pending", "approved", "rejected", "cancelled"].map((s) => (
          <Link
            key={s}
            href={`/admin/payments?status=${s}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              status === s ? "bg-primary text-white" : "border border-slate-200 bg-white text-slate-600"
            )}
          >
            {s === "all" ? "الكل" : paymentStatusLabels[s as keyof typeof paymentStatusLabels]}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد طلبات دفع هنا.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-right text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">المطور</th>
                <th className="px-4 py-3 font-semibold">الخطة</th>
                <th className="px-4 py-3 font-semibold">USD</th>
                <th className="px-4 py-3 font-semibold">SDG</th>
                <th className="px-4 py-3 font-semibold">رقم العملية</th>
                <th className="px-4 py-3 font-semibold">تاريخ التحويل</th>
                <th className="px-4 py-3 font-semibold">الحالة</th>
                <th className="px-4 py-3 font-semibold">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/payments/${r.id}`} className="font-semibold text-navy hover:text-primary">
                      {r.developerName}
                    </Link>
                    {r.developerEmail && <p className="text-xs text-slate-400">{r.developerEmail}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{planPickLabels[r.plan as "basic" | "pro"]}</td>
                  <td className="px-4 py-3 text-slate-600">${r.amountUsd.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-slate-600">{r.amountSdg.toLocaleString("en-US")}</td>
                  <td className="px-4 py-3 text-slate-600">{r.transactionReference}</td>
                  <td className="px-4 py-3 text-slate-600">{r.transferDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        paymentStatusStyles[r.status]
                      )}
                    >
                      {paymentStatusLabels[r.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
