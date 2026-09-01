import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, ChevronLeft } from "lucide-react";
import { getCurrentUser, getMyDeviceReports } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ReportStatusBadge } from "@/components/devices/ReportStatusBadge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "بلاغاتي | سندك",
};

const reportTypeLabel: Record<string, string> = { LOST: "مفقود", STOLEN: "مسروق" };

export default async function MyDeviceReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const reports = await getMyDeviceReports(user.id);

  return (
    <Container className="py-8 sm:py-12">
      <SectionHeader title="بلاغاتي" subtitle="بلاغات الفقدان والسرقة التي قدّمتها" />

      {reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <ShieldAlert className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-500">لا توجد بلاغات بعد. يمكنك الإبلاغ عن جهاز من صفحة تفاصيله.</p>
          <Link
            href="/devices"
            className="mt-2 flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
          >
            أجهزتي
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/devices/reports/${r.id}`}
              className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-bold text-navy">
                    {r.deviceBrand} {r.deviceModel} · {reportTypeLabel[r.reportType] ?? r.reportType}
                  </h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">قُدّم في {formatDate(r.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <ReportStatusBadge status={r.status} />
                <span className="flex items-center gap-0.5 text-xs font-semibold text-primary group-hover:text-primary-dark">
                  التفاصيل
                  <ChevronLeft className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
