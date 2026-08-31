import type { Metadata } from "next";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AppIcon } from "@/components/ui/AppIcon";
import { StatusBadge } from "@/components/ui/Badge";
import { getAllAppsAdmin } from "@/lib/supabase/queries";
import { getCategoryBySlug } from "@/data/categories";
import { formatDate } from "@/lib/utils";
import { approveAppAction, rejectAppAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "مراجعة التطبيقات | سندك",
};

export default async function AdminAppsPage() {
  const apps = await getAllAppsAdmin();
  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">مراجعة التطبيقات</h1>
        <p className="mt-1 text-sm text-slate-500">
          راجع التطبيقات المرسلة من المطورين، واعتمدها أو ارفضها
        </p>
      </div>

      <section className="mb-12">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-navy">
          <Clock className="h-5 w-5 text-amber-600" />
          قيد المراجعة ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="text-sm text-slate-500">لا توجد تطبيقات قيد المراجعة حاليًا.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((app) => {
              const category = getCategoryBySlug(app.categorySlug);
              return (
                <div
                  key={app.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <AppIcon name={app.name} color={app.iconColor} size="sm" />
                    <div>
                      <p className="font-bold text-navy">{app.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{app.developer}</p>
                      <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                        {app.shortDescription}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5">
                          {category?.name ?? "—"}
                        </span>
                        <span>الإصدار {app.version}</span>
                        <span>{formatDate(app.lastUpdate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <form action={approveAppAction}>
                      <input type="hidden" name="appId" value={app.id} />
                      <button
                        type="submit"
                        className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        اعتماد
                      </button>
                    </form>
                    <form action={rejectAppAction}>
                      <input type="hidden" name="appId" value={app.id} />
                      <button
                        type="submit"
                        className="flex h-10 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                      >
                        <XCircle className="h-4 w-4" />
                        رفض
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-navy">كل التطبيقات ({reviewed.length})</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">التطبيق</th>
                  <th className="px-5 py-3 font-semibold">المطور</th>
                  <th className="px-5 py-3 font-semibold">الحالة</th>
                  <th className="px-5 py-3 font-semibold">آخر تحديث</th>
                </tr>
              </thead>
              <tbody>
                {reviewed.map((app) => (
                  <tr key={app.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <AppIcon name={app.name} color={app.iconColor} size="sm" />
                        <span className="font-semibold text-navy">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{app.developer}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(app.lastUpdate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Container>
  );
}
