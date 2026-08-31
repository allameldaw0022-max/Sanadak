import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "الإعدادات | سندك",
};

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">الإعدادات</h1>
        <p className="mt-1 text-sm text-slate-500">معلومات حساب المشرف</p>
      </div>

      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">الاسم</span>
            <span className="font-semibold text-navy">{user.fullName || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">البريد الإلكتروني</span>
            <span className="font-semibold text-navy">{user.email || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">الصلاحية</span>
            <span className="font-semibold text-navy">مشرف</span>
          </div>
        </div>
      </div>
    </div>
  );
}
