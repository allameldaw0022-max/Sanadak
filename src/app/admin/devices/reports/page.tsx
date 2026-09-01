import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDeviceReports } from "@/lib/supabase/queries";
import { ReportStatusBadge } from "@/components/devices/ReportStatusBadge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "بلاغات الأجهزة | سندك",
};

const reportTypeLabel: Record<string, string> = { LOST: "مفقود", STOLEN: "مسروق" };

export default async function AdminDeviceReportsPage() {
  const reports = await getAdminDeviceReports();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">بلاغات الأجهزة</h1>
        <p className="mt-1 text-sm text-slate-500">بلاغات الفقدان والسرقة ({reports.length})</p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد بلاغات حاليًا.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/admin/devices/reports/${r.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/30"
            >
              <div>
                <p className="text-sm font-bold text-navy">
                  {r.deviceBrand} {r.deviceModel} · {reportTypeLabel[r.reportType] ?? r.reportType}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.reporterEmail ?? "—"} · {formatDateTime(r.createdAt)}
                </p>
              </div>
              <ReportStatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
