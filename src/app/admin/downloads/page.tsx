import type { Metadata } from "next";
import { AppIcon } from "@/components/ui/AppIcon";
import { getAdminDownloads } from "@/lib/supabase/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "التحميلات | سندك",
};

export default async function AdminDownloadsPage() {
  const downloads = await getAdminDownloads();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">التحميلات</h1>
        <p className="mt-1 text-sm text-slate-500">سجل عمليات تحميل التطبيقات ({downloads.length})</p>
      </div>

      {downloads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد عمليات تحميل مسجلة بعد.</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                    <th className="px-5 py-3 font-semibold">التطبيق</th>
                    <th className="px-5 py-3 font-semibold">وقت التحميل</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map((download) => (
                    <tr key={download.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <AppIcon name={download.appName} color={download.appIconColor} size="sm" />
                          <span className="font-semibold text-navy">{download.appName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{formatDateTime(download.downloadedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            ملاحظة: لا يتم حاليًا تسجيل نوع جهاز المستخدم عند التحميل.
          </p>
        </>
      )}
    </div>
  );
}
