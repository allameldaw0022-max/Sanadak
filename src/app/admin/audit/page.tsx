import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getAdminSecurityEvents } from "@/lib/supabase/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "سجل الأمان | سندك",
};

// security_events.metadata never contains a raw IMEI or a secret -- every
// Server Action that logs to it (see src/lib/security/audit.ts call sites)
// only ever passes an imei_hash, a device_id, or non-sensitive counts, and
// that discipline is enforced at the call site, not here. This page adds
// no new visibility beyond what admin already has via
// security_events_select_own_or_admin.
export default async function AdminAuditPage() {
  const events = await getAdminSecurityEvents(150);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">سجل الأمان</h1>
        <p className="mt-1 text-sm text-slate-500">أحدث الأحداث الأمنية المسجّلة في النظام ({events.length})</p>
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد أحداث مسجّلة بعد.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                  <th className="px-5 py-3 font-semibold">الحدث</th>
                  <th className="px-5 py-3 font-semibold">الفاعل</th>
                  <th className="px-5 py-3 font-semibold">التفاصيل</th>
                  <th className="px-5 py-3 font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        <ShieldCheck className="h-3 w-3" />
                        {e.eventType}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {e.actorEmail ?? (e.actorRole === "anonymous" ? "زائر" : "—")}
                    </td>
                    <td className="px-5 py-3 max-w-xs truncate text-[11px] text-slate-400" dir="ltr">
                      {e.metadata && Object.keys(e.metadata as object).length > 0 ? JSON.stringify(e.metadata) : "—"}
                    </td>
                    <td className="px-5 py-3 shrink-0 text-slate-500">{formatDateTime(e.createdAt)}</td>
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
