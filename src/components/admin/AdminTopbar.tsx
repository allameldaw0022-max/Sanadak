"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminNavLinks } from "./AdminSidebar";
import { AdminNotificationBell } from "./AdminNotificationBell";
import type { AdminInboxNotification } from "@/lib/supabase/queries";

export function AdminTopbar({ notifications }: { notifications: AdminInboxNotification[] }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-16 z-30 border-b border-slate-200 bg-white md:hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-3">
        <p className="text-sm font-bold text-navy">لوحة تحكم سندك</p>
        <AdminNotificationBell notifications={notifications} />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {adminNavLinks.map((link) => {
          const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                isActive ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
