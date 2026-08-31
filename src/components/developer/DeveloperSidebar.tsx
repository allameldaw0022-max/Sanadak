"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/developer/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/developer/dashboard/apps/new", label: "إضافة تطبيق", icon: PlusCircle },
];

export function DeveloperSidebar({
  developerName,
  developerEmail,
}: {
  developerName: string;
  developerEmail: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-l border-slate-200 bg-white md:flex md:flex-col">
      <div className="border-b border-slate-100 p-6">
        <p className="text-sm font-bold text-navy">{developerName}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{developerEmail}</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                isActive
                  ? "bg-primary-light text-primary-dark"
                  : "text-slate-600 hover:bg-slate-50"
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

export { links as developerNavLinks };
