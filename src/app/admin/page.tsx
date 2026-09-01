import type { Metadata } from "next";
import Link from "next/link";
import { LayoutGrid, CheckCircle2, Clock, XCircle, UserCog, Users, Download, DollarSign, CreditCard } from "lucide-react";
import { StatsCard } from "@/components/developer/StatsCard";
import { AppIcon } from "@/components/ui/AppIcon";
import { StatusBadge } from "@/components/ui/Badge";
import { getAdminStats, getAdminApps, getAdminPaymentStats } from "@/lib/supabase/queries";
import { formatDownloads } from "@/lib/utils";

export const metadata: Metadata = {
  title: "لوحة التحكم | سندك",
};

export default async function AdminDashboardPage() {
  const [stats, apps, paymentStats] = await Promise.all([
    getAdminStats(),
    getAdminApps(),
    getAdminPaymentStats(),
  ]);
  const recentPending = apps.filter((app) => app.status === "pending").slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-slate-500">نظرة عامة على نشاط منصة سندك</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="إجمالي التطبيقات" value={stats.totalApps} icon={LayoutGrid} color="#0F172A" />
        <StatsCard label="التطبيقات المعتمدة" value={stats.approvedApps} icon={CheckCircle2} color="#16A34A" />
        <StatsCard label="قيد المراجعة" value={stats.pendingApps} icon={Clock} color="#B45309" />
        <StatsCard label="التطبيقات المرفوضة" value={stats.rejectedApps} icon={XCircle} color="#DC2626" />
        <StatsCard label="إجمالي المطورين" value={stats.totalDevelopers} icon={UserCog} color="#0EA5E9" />
        <StatsCard label="إجمالي المستخدمين" value={stats.totalUsers} icon={Users} color="#7C3AED" />
        <StatsCard
          label="إجمالي التحميلات"
          value={formatDownloads(stats.totalDownloads)}
          icon={Download}
          color="#DB2777"
        />
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">الاشتراكات والإيرادات</h2>
          <Link
            href="/admin/payments"
            className="text-sm font-semibold text-primary hover:text-primary-dark"
          >
            عرض المدفوعات
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label="إيرادات هذا الشهر"
            value={`$${paymentStats.revenueThisMonthUsd.toLocaleString("en-US")}`}
            icon={DollarSign}
            color="#16A34A"
          />
          <StatsCard
            label="إيرادات هذه السنة"
            value={`$${paymentStats.revenueThisYearUsd.toLocaleString("en-US")}`}
            icon={DollarSign}
            color="#0F172A"
          />
          <StatsCard
            label="اشتراكات نشطة (أساسي/احترافي)"
            value={`${paymentStats.activeBasicCount} / ${paymentStats.activeProCount}`}
            icon={UserCog}
            color="#0EA5E9"
          />
          <StatsCard
            label="طلبات دفع معلقة"
            value={paymentStats.pendingCount}
            icon={CreditCard}
            color="#B45309"
          />
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">أحدث التطبيقات قيد المراجعة</h2>
          <Link
            href="/admin/apps?status=pending"
            className="text-sm font-semibold text-primary hover:text-primary-dark"
          >
            عرض الكل
          </Link>
        </div>

        {recentPending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="text-sm text-slate-500">لا توجد تطبيقات قيد المراجعة حاليًا.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPending.map((app) => (
              <Link
                key={app.id}
                href={`/admin/apps/${app.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AppIcon name={app.name} color={app.iconColor} iconUrl={app.iconUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-navy">{app.name}</p>
                    <p className="truncate text-xs text-slate-500">{app.developerName}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
