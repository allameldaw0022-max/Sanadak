import type { AppItem } from "@/data/types";
import { getCategoryBySlug } from "@/data/categories";
import { formatDate, formatDownloads } from "@/lib/utils";
import { AppIcon } from "@/components/ui/AppIcon";
import { StatusBadge } from "@/components/ui/Badge";

export function AppsTable({ apps }: { apps: AppItem[] }) {
  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
        <p className="text-sm text-slate-500">لا توجد تطبيقات مضافة بعد.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-right text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
              <th className="px-5 py-3 font-semibold">التطبيق</th>
              <th className="px-5 py-3 font-semibold">التصنيف</th>
              <th className="px-5 py-3 font-semibold">الإصدار</th>
              <th className="px-5 py-3 font-semibold">الحالة</th>
              <th className="px-5 py-3 font-semibold">التحميلات</th>
              <th className="px-5 py-3 font-semibold">آخر تحديث</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const category = getCategoryBySlug(app.categorySlug);
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
