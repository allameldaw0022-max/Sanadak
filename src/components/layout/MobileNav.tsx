"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Grid3x3, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({ accountHref }: { accountHref: string }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/apps", label: "التطبيقات", icon: LayoutGrid },
    { href: "/categories", label: "التصنيفات", icon: Grid3x3 },
    { href: accountHref, label: "حسابي", icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex items-stretch justify-between px-1">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-slate-400"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
