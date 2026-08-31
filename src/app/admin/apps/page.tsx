import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { StatusBadge } from "@/components/ui/Badge";
import { AdminSearchInput } from "@/components/admin/AdminSearchInput";
import { getAdminApps } from "@/lib/supabase/queries";
import { formatDate, formatDownloads, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "إدارة التطبيقات | سندك",
};

const statusTabs = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "قيد المراجعة" },
  { value: "approved", label: "معتمد" },
  { value: "rejected", label: "مرفوض" },
] as const;

export default async function AdminAppsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const apps = await getAdminApps();

  const query = q.trim().toLowerCase();
  const filtered = apps.filter((app) => {
    const matchesStatus = status === "all" || app.status === status;
    const matchesQuery =
      !query ||
      app.name.toLowerCase().includes(query) ||
      app.developerName.toLowerCase().includes(query);
    return matchesStatus && matchesQuery;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">إدارة التطبيقات</h1>
        <p className="mt-1 text-sm text-slate-500">
          راجع كل التطبيقات المرسلة على سندك، واعتمدها أو ارفضها
        </p>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {statusTabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin/apps?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={cn(
                "flex shrink-0 items-center rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                status === tab.value
                  ? "bg-primary text-white"
                  : "border border-slate-200 bg-white text-slate-600"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="sm:w-72">
          <AdminSearchInput placeholder="ابحث باسم التطبيق أو المطور..." />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد تطبيقات مطابقة.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">التطبيق</th>
                  <th className="px-5 py-3 font-semibold">المطور</th>
                  <th className="px-5 py-3 font-semibold">التصنيف</th>
                  <th className="px-5 py-3 font-semibold">الإصدار</th>
                  <th className="px-5 py-3 font-semibold">التحميلات</th>
                  <th className="px-5 py-3 font-semibold">الحالة</th>
                  <th className="px-5 py-3 font-semibold">تاريخ الإضافة</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <AppIcon name={app.name} color={app.iconColor} size="sm" />
                        <span className="font-semibold text-navy">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{app.developerName}</td>
                    <td className="px-5 py-3 text-slate-600">{app.categoryName}</td>
                    <td className="px-5 py-3 text-slate-600">{app.version}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDownloads(app.downloadsCount)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(app.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/apps/${app.id}`}
                        className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark"
                      >
                        مراجعة
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
