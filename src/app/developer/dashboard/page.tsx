import Link from "next/link";
import type { Metadata } from "next";
import { LayoutGrid, Download, CheckCircle2, Clock, PlusCircle } from "lucide-react";
import { StatsCard } from "@/components/developer/StatsCard";
import { AppsTable } from "@/components/developer/AppsTable";
import { developerApps, getDeveloperStats } from "@/data/developer";
import { formatDownloads } from "@/lib/utils";

export const metadata: Metadata = {
  title: "لوحة التحكم | سندك",
};

export default function DeveloperDashboardPage() {
  const stats = getDeveloperStats();

  return (
    <div>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">نظرة عامة</h1>
          <p className="mt-1 text-sm text-slate-500">متابعة أداء تطبيقاتك على سندك</p>
        </div>
        <Link
          href="/developer/dashboard/apps/new"
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-dark sm:w-auto"
        >
          <PlusCircle className="h-4 w-4" />
          إضافة تطبيق
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="عدد التطبيقات" value={stats.totalApps} icon={LayoutGrid} color="#16A34A" />
        <StatsCard
          label="إجمالي التحميلات"
          value={formatDownloads(stats.totalDownloads)}
          icon={Download}
          color="#0EA5E9"
        />
        <StatsCard
          label="التطبيقات المنشورة"
          value={stats.publishedApps}
          icon={CheckCircle2}
          color="#15803D"
        />
        <StatsCard
          label="قيد المراجعة"
          value={stats.pendingApps}
          icon={Clock}
          color="#B45309"
        />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-navy">تطبيقاتي</h2>
        <AppsTable apps={developerApps} />
      </div>
    </div>
  );
}
