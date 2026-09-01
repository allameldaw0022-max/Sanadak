import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { getAdminCertificates } from "@/lib/supabase/queries";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الشهادات | سندك",
};

export default async function AdminCertificatesPage() {
  const certificates = await getAdminCertificates();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">الشهادات</h1>
        <p className="mt-1 text-sm text-slate-500">شهادات ملكية الأجهزة الصادرة ({certificates.length})</p>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد شهادات صادرة بعد.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">الجهاز</th>
                  <th className="px-5 py-3 font-semibold">صاحب الشهادة</th>
                  <th className="px-5 py-3 font-semibold">الحالة</th>
                  <th className="px-5 py-3 font-semibold">تاريخ الإصدار</th>
                  <th className="px-5 py-3 font-semibold">التحقق</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-semibold text-navy">
                      {c.deviceBrand} {c.deviceModel}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.issuedToEmail ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                          c.valid ? "bg-primary-light text-primary-dark" : "bg-slate-100 text-slate-500"
                        )}
                      >
                        <BadgeCheck className="h-3 w-3" />
                        {c.valid ? "سارية" : "غير سارية"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(c.issuedAt)}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/verify/${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary hover:text-primary-dark"
                      >
                        فتح صفحة التحقق
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
