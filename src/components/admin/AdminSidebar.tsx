"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Smartphone, FileSearch, ShieldAlert, BadgeCheck, Store, CreditCard, Tag, Bell, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminNotificationBell } from "./AdminNotificationBell";
import type { AdminInboxNotification } from "@/lib/supabase/queries";

const links = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/devices", label: "الأجهزة", icon: Smartphone },
  { href: "/admin/devices/claims", label: "مطالبات الملكية", icon: FileSearch },
  { href: "/admin/devices/reports", label: "بلاغات الأجهزة", icon: ShieldAlert },
  { href: "/admin/certificates", label: "الشهادات", icon: BadgeCheck },
  { href: "/admin/dealers", label: "التجار", icon: Store },
  { href: "/admin/subscriptions", label: "الاشتراكات", icon: CreditCard },
  { href: "/admin/subscriptions/plans", label: "خطط الاشتراك", icon: Tag },
  { href: "/admin/notifications", label: "الإشعارات", icon: Bell },
  { href: "/admin/audit", label: "سجل الأمان", icon: ShieldCheck },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
];

export function AdminSidebar({
  adminName,
  adminEmail,
  notifications,
}: {
  adminName: string;
  adminEmail: string;
  notifications: AdminInboxNotification[];
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-l border-slate-200 bg-white md:flex md:flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-6">
        <div className="min-w-0">
          <p className="text-sm font-bold text-navy">{adminName}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{adminEmail}</p>
        </div>
        <AdminNotificationBell notifications={notifications} />
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                isActive ? "bg-primary-light text-primary-dark" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { links as adminNavLinks };
