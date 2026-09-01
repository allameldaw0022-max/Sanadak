import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion, AlertTriangle, ScanLine } from "lucide-react";
import { StatsCard } from "@/components/developer/StatsCard";
import { SecurityStatusBadge, RiskLevelBadge } from "@/components/ui/SecurityStatusBadge";
import { getAdminSecurityStats, getAdminSecurityScansList } from "@/lib/supabase/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الأمان | سندك",
};

export default async function AdminSecurityPage() {
  const [stats, scans] = await Promise.all([getAdminSecurityStats(), getAdminSecurityScansList()]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">فحص أمان ملفات APK</h1>
        <p className="mt-1 text-sm text-slate-500">
          نظام متعدد الطبقات لتقليل مخاطر التطبيقات الضارة واكتشاف المؤشرات المشبوهة قبل نشر APK.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="إجمالي الملفات المفحوصة" value={stats.totalScanned} icon={ScanLine} color="#0F172A" />
        <StatsCard label="اجتازت الفحص" value={stats.passed} icon={ShieldCheck} color="#16A34A" />
        <StatsCard label="تحتاج مراجعة" value={stats.reviewRequired} icon={ShieldQuestion} color="#B45309" />
        <StatsCard label="لم تجتز الفحص" value={stats.failed} icon={ShieldX} color="#DC2626" />
        <StatsCard label="خطورة حرجة" value={stats.critical} icon={AlertTriangle} color="#DC2626" />
        <StatsCard label="خطورة مرتفعة" value={stats.high} icon={ShieldAlert} color="#EA580C" />
        <StatsCard label="خطورة متوسطة" value={stats.medium} icon={ShieldAlert} color="#B45309" />
        <StatsCard label="خطورة منخفضة" value={stats.low} icon={ShieldCheck} color="#16A34A" />
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-navy">آخر عمليات الفحص</h2>

        {scans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="text-sm text-slate-500">لا توجد عمليات فحص بعد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-right text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">التطبيق</th>
                  <th className="px-4 py-3">المطور</th>
                  <th className="px-4 py-3">الإصدار</th>
                  <th className="px-4 py-3">SHA-256</th>
                  <th className="px-4 py-3">حالة الفحص</th>
                  <th className="px-4 py-3">الخطورة</th>
                  <th className="px-4 py-3">Malware</th>
                  <th className="px-4 py-3">تاريخ الفحص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((scan) => (
                  <tr key={scan.scanId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-navy">
                      <Link href={`/admin/apps/${scan.appId}`} className="hover:text-primary">
                        {scan.appName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{scan.developerName}</td>
                    <td className="px-4 py-3 text-slate-600">{scan.version ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500" dir="ltr">
                      {scan.sha256.slice(0, 16)}…
                    </td>
                    <td className="px-4 py-3">
                      <SecurityStatusBadge status={scan.scanStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskLevelBadge level={scan.riskLevel} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{scan.malwareStatus}</td>
                    <td className="px-4 py-3 text-slate-500">{formatDateTime(scan.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
