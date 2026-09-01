import type { Metadata } from "next";
import { Smartphone, CheckCircle2, Clock, ShieldQuestion, ShieldAlert, RefreshCw, FileSearch, Bell, Store } from "lucide-react";
import { StatsCard } from "@/components/developer/StatsCard";
import { getAdminDeviceStats } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "لوحة التحكم | سندك",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminDeviceStats();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">لوحة تحكم سندك</h1>
        <p className="mt-1 text-sm text-slate-500">نظرة عامة على نظام فحص وتوثيق الأجهزة</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="إجمالي الأجهزة" value={stats.totalDevices} icon={Smartphone} color="#0F172A" />
        <StatsCard label="نشط" value={stats.active} icon={CheckCircle2} color="#16A34A" />
        <StatsCard label="قيد المراجعة" value={stats.underReview} icon={Clock} color="#B45309" />
        <StatsCard label="مفقود" value={stats.lost} icon={ShieldQuestion} color="#EA580C" />
        <StatsCard label="مسروق" value={stats.stolen} icon={ShieldAlert} color="#DC2626" />
        <StatsCard label="مسترجع" value={stats.recovered} icon={RefreshCw} color="#0EA5E9" />
        <StatsCard label="مطالبات قيد المراجعة" value={stats.pendingClaims} icon={FileSearch} color="#7C3AED" />
        <StatsCard label="بلاغات قيد المراجعة" value={stats.pendingReports} icon={ShieldAlert} color="#DC2626" />
        <StatsCard label="إشعارات" value={stats.totalNotifications} icon={Bell} color="#DB2777" />
        <StatsCard label="التجار" value={stats.totalDealers} icon={Store} color="#0F172A" />
      </div>
    </div>
  );
}
