import type { Metadata } from "next";
import { getAdminDevelopers } from "@/lib/supabase/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "المطورون | سندك",
};

export default async function AdminDevelopersPage() {
  const developers = await getAdminDevelopers();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">المطورون</h1>
        <p className="mt-1 text-sm text-slate-500">
          كل المطورين المسجلين على سندك ({developers.length})
        </p>
      </div>

      {developers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا يوجد مطورون مسجلون بعد.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">المطور</th>
                  <th className="px-5 py-3 font-semibold">البريد</th>
                  <th className="px-5 py-3 font-semibold">إجمالي التطبيقات</th>
                  <th className="px-5 py-3 font-semibold">المعتمدة</th>
                  <th className="px-5 py-3 font-semibold">قيد المراجعة</th>
                  <th className="px-5 py-3 font-semibold">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody>
                {developers.map((dev) => (
                  <tr key={dev.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 font-semibold text-navy">{dev.fullName}</td>
                    <td className="px-5 py-3 text-slate-600">{dev.email}</td>
                    <td className="px-5 py-3 text-slate-600">{dev.totalApps}</td>
                    <td className="px-5 py-3 text-slate-600">{dev.approvedApps}</td>
                    <td className="px-5 py-3 text-slate-600">{dev.pendingApps}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(dev.createdAt)}</td>
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
