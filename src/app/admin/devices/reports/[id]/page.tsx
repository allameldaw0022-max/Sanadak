import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { getAdminReportById } from "@/lib/supabase/queries";
import { ReportStatusBadge } from "@/components/devices/ReportStatusBadge";
import { DeviceCaseReviewForm } from "@/components/admin/DeviceCaseReviewForm";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "مراجعة بلاغ جهاز | سندك",
};

const reportTypeLabel: Record<string, string> = { LOST: "مفقود", STOLEN: "مسروق" };

export default async function AdminReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getAdminReportById(id);
  if (!report) notFound();

  const isClosed = report.status === "APPROVED" || report.status === "REJECTED";

  return (
    <div>
      <Link
        href="/admin/devices/reports"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        بلاغات الأجهزة
      </Link>

      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold text-navy">
              {report.deviceBrand} {report.deviceModel} · {reportTypeLabel[report.reportType] ?? report.reportType}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">المُبلّغ: {report.reporterEmail ?? "—"}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              قُدّم في {formatDateTime(report.createdAt)} · آخر تحديث {formatDateTime(report.updatedAt)}
            </p>
          </div>
          <ReportStatusBadge status={report.status} />
        </div>

        {report.details && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-navy">
            <p className="text-xs font-semibold text-slate-500">تفاصيل البلاغ</p>
            <p className="mt-1">{report.details}</p>
          </div>
        )}

        <div className="mt-4">
          <h2 className="mb-2 text-sm font-bold text-navy">الأدلة</h2>
          {report.evidence.length === 0 ? (
            <p className="text-xs text-slate-400">لا توجد أدلة مرفقة.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {report.evidence.map((e) =>
                e.signedUrl ? (
                  <a
                    key={e.id}
                    href={e.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <Image src={e.signedUrl} alt="دليل البلاغ" fill className="object-cover" unoptimized />
                  </a>
                ) : (
                  <div
                    key={e.id}
                    className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300"
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {isClosed ? (
          <p className="mt-4 text-xs text-slate-400">تم إغلاق هذا البلاغ نهائيًا.</p>
        ) : (
          <DeviceCaseReviewForm kind="report" id={report.id} />
        )}
      </div>
    </div>
  );
}
