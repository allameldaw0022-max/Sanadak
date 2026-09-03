"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { markAdminNotificationReadAction, markAllAdminNotificationsReadAction } from "@/app/admin/notifications/actions";
import type { AdminInboxNotification } from "@/lib/supabase/queries";

// related_table on every admin_* notification always maps to a page an
// admin can act from -- ownership_claims/device_reports have per-id review
// pages, dealer_subscription_requests does not (its review UI is the list
// page itself), so this never returns null for a row this component
// actually renders.
function notificationHref(n: AdminInboxNotification): string {
  if (n.relatedTable === "ownership_claims" && n.relatedId) return `/admin/devices/claims/${n.relatedId}`;
  if (n.relatedTable === "device_reports" && n.relatedId) return `/admin/devices/reports/${n.relatedId}`;
  if (n.relatedTable === "dealer_subscription_requests") return "/admin/subscriptions";
  return "/admin/notifications";
}

export function AdminNotificationBell({ notifications }: { notifications: AdminInboxNotification[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleItemClick(n: AdminInboxNotification) {
    setOpen(false);
    if (n.readAt) return;
    startTransition(() => {
      markAdminNotificationReadAction(n.id);
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllAdminNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروءة)` : ""}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-2 w-[22rem] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-navy">إشعارات تحتاج مراجعة</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAll}
                disabled={pending}
                className="text-[11px] font-semibold text-primary hover:underline disabled:opacity-60"
              >
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-400">لا توجد إشعارات حاليًا.</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <Link
                  key={n.id}
                  href={notificationHref(n)}
                  onClick={() => handleItemClick(n)}
                  className={cn(
                    "block border-b border-slate-50 px-4 py-3 text-right last:border-0 hover:bg-slate-50",
                    !n.readAt && "bg-primary-light/30"
                  )}
                >
                  <p className="text-xs font-bold text-navy">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-[11px] text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(n.createdAt)}</p>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/admin/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
          >
            عرض كل الإشعارات
          </Link>
        </div>
      )}
    </div>
  );
}
