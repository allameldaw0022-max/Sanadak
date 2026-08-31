"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, AppWindow, UserCog, Users, Download, Flag, CreditCard, Settings, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/admin/apps", label: "التطبيقات", icon: AppWindow },
  { href: "/admin/developers", label: "المطورون", icon: UserCog },
  { href: "/admin/users", label: "المستخدمون", icon: Users },
  { href: "/admin/downloads", label: "التحميلات", icon: Download },
  { href: "/admin/reports", label: "البلاغات", icon: Flag },
  { href: "/admin/payments", label: "المدفوعات", icon: CreditCard },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export function AdminSidebar({ adminName, adminEmail }: { adminName: string; adminEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-l border-slate-200 bg-white md:flex md:flex-col">
      <div className="border-b border-slate-100 p-6">
        <p className="text-sm font-bold text-navy">{adminName}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{adminEmail}</p>
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

      <div className="border-t border-slate-100 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-50"
        >
          <Store className="h-5 w-5" />
          العودة للمتجر
        </Link>
      </div>
    </aside>
  );
}

export { links as adminNavLinks };
