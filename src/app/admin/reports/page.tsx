import type { Metadata } from "next";
import Link from "next/link";
import { getAdminReports } from "@/lib/supabase/queries";
import { reportReasons } from "@/data/reportReasons";
import { ReportStatusForm } from "@/components/admin/ReportStatusForm";
import { formatDateTime, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "البلاغات | سندك",
};

const statusLabels: Record<string, string> = {
  open: "مفتوح",
  reviewing: "قيد المراجعة",
  resolved: "تم الحل",
  dismissed: "مرفوض",
};

const statusStyles: Record<string, string> = {
  open: "bg-amber-50 text-amber-700",
  reviewing: "bg-sky-50 text-sky-700",
  resolved: "bg-primary-light text-primary-dark",
  dismissed: "bg-slate-100 text-slate-500",
};

function reasonLabel(value: string) {
  return reportReasons.find((r) => r.value === value)?.label ?? value;
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "all" } = await searchParams;
  const reports = await getAdminReports();
  const filtered = status === "all" ? reports : reports.filter((r) => r.status === status);
  const openCount = reports.filter((r) => r.status === "open").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">البلاغات</h1>
        <p className="mt-1 text-sm text-slate-500">
          بلاغات المستخدمين عن التطبيقات ({openCount} مفتوح من أصل {reports.length})
        </p>
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {["all", "open", "reviewing", "resolved", "dismissed"].map((s) => (
          <Link
            key={s}
            href={`/admin/reports?status=${s}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
              status === s ? "bg-primary text-white" : "border border-slate-200 bg-white text-slate-600"
            )}
          >
            {s === "all" ? "الكل" : statusLabels[s]}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد بلاغات هنا.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div key={report.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-navy">{report.appName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    السبب: {reasonLabel(report.reason)}
                    {report.reporterEmail ? ` · بواسطة ${report.reporterEmail}` : " · بلاغ مجهول"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDateTime(report.createdAt)}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                    statusStyles[report.status]
                  )}
                >
                  {statusLabels[report.status] ?? report.status}
                </span>
              </div>

              {report.details && (
                <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  {report.details}
                </p>
              )}

              {report.adminNote && (
                <p className="mt-2 text-xs text-slate-500">
                  <span className="font-semibold text-navy">ملاحظة الإدارة:</span> {report.adminNote}
                </p>
              )}

              <ReportStatusForm reportId={report.id} status={report.status} adminNote={report.adminNote} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
