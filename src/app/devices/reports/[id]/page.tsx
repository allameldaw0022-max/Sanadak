import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { ArrowRight, ShieldAlert, FileText } from "lucide-react";
import { getCurrentUser, getMyReportById } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { ReportStatusBadge } from "@/components/devices/ReportStatusBadge";
import { ReportEvidenceUpload } from "@/components/devices/ReportEvidenceUpload";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تفاصيل البلاغ | سندك",
  robots: { index: false },
};

const CLOSED_STATUSES = new Set(["APPROVED", "REJECTED"]);
const reportTypeLabel: Record<string, string> = { LOST: "مفقود", STOLEN: "مسروق" };

export default async function DeviceReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const report = await getMyReportById(user.id, id);
  if (!report) notFound();

  const isClosed = CLOSED_STATUSES.has(report.status);

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href="/devices"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        أجهزتي
      </Link>

      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <ShieldAlert className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-lg font-extrabold text-navy">
                  بلاغ {reportTypeLabel[report.reportType] ?? report.reportType}
                </h1>
                <p className="text-xs text-slate-500">
                  {report.deviceBrand} {report.deviceModel}
                </p>
              </div>
            </div>
            <ReportStatusBadge status={report.status} />
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            قُدّم في {formatDate(report.createdAt)} · آخر تحديث {formatDate(report.updatedAt)}
          </p>

          {report.details && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">التفاصيل</p>
              <p className="mt-1 text-sm text-navy">{report.details}</p>
            </div>
          )}

          {report.status === "REJECTED" && report.adminNote && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <p className="font-semibold">ملاحظة الإدارة</p>
              <p className="mt-1">{report.adminNote}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-bold text-navy">الأدلة المرفقة</h2>

          {report.evidence.length === 0 ? (
            <p className="text-xs text-slate-400">لم تُرفق أي أدلة بعد.</p>
          ) : (
            <div className="mb-4 grid grid-cols-3 gap-2">
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
                    <FileText className="h-6 w-6" />
                  </div>
                )
              )}
            </div>
          )}

          {isClosed ? (
            <p className="text-[11px] text-slate-400">تم إغلاق هذا البلاغ، لا يمكن إضافة أدلة جديدة.</p>
          ) : (
            <ReportEvidenceUpload reportId={report.id} />
          )}
        </div>
      </div>
    </Container>
  );
}
