import type { AppItem } from "@/data/types";
import { getCategoryBySlug } from "@/data/categories";
import { formatDate, formatDownloads } from "@/lib/utils";
import { AppIcon } from "@/components/ui/AppIcon";
import { StatusBadge } from "@/components/ui/Badge";
import { SecurityStatusBadge } from "@/components/ui/SecurityStatusBadge";
import type { DeveloperAppSecurity } from "@/lib/supabase/queries";

export function AppsTable({
  apps,
  appsSecurity,
}: {
  apps: AppItem[];
  appsSecurity?: DeveloperAppSecurity[];
}) {
  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">لا توجد تطبيقات مضافة بعد.</p>
      </div>
    );
  }

  const securityByAppId = new Map((appsSecurity ?? []).map((s) => [s.appId, s]));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] text-right text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <th className="px-5 py-3 font-semibold">التطبيق</th>
              <th className="px-5 py-3 font-semibold">التصنيف</th>
              <th className="px-5 py-3 font-semibold">الإصدار</th>
              <th className="px-5 py-3 font-semibold">حالة المراجعة</th>
              <th className="px-5 py-3 font-semibold">الفحص الأمني</th>
              <th className="px-5 py-3 font-semibold">التحميلات</th>
              <th className="px-5 py-3 font-semibold">آخر تحديث</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const category = getCategoryBySlug(app.categorySlug);
              const security = securityByAppId.get(app.id);
              const topFinding = security?.findings.find(
                (f) => f.severity === "high" || f.severity === "critical"
              );
              return (
                <tr key={app.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <AppIcon name={app.name} color={app.iconColor} size="sm" />
                      <span className="font-semibold text-navy">{app.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{category?.name ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{app.version}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="px-5 py-3">
                    {security ? (
                      <div>
                        <SecurityStatusBadge status={security.securityStatus} />
                        {topFinding && (
                          <p className="mt-1 max-w-[220px] text-[11px] leading-relaxed text-slate-500">
                            {topFinding.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {app.downloads > 0 ? formatDownloads(app.downloads) : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(app.lastUpdate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
