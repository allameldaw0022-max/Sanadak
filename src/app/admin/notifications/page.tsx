import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { getAdminNotifications } from "@/lib/supabase/queries";
import { formatDateTime, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "الإشعارات | سندك",
};

export default async function AdminNotificationsPage() {
  const notifications = await getAdminNotifications();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy">الإشعارات</h1>
        <p className="mt-1 text-sm text-slate-500">أحدث إشعارات النظام لكل المستخدمين ({notifications.length})</p>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <p className="text-sm text-slate-500">لا توجد إشعارات بعد.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                <Bell className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-navy">{n.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      n.readAt ? "bg-slate-100 text-slate-500" : "bg-primary-light text-primary-dark"
                    )}
                  >
                    {n.readAt ? "مقروء" : "غير مقروء"}
                  </span>
                </div>
                {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                <p className="mt-1 text-[11px] text-slate-400">
                  {n.userEmail ?? "—"} · {n.type} · {formatDateTime(n.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
