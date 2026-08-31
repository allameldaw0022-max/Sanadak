"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { developerNavLinks } from "./DeveloperSidebar";

export function DeveloperTopbar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-16 z-30 border-b border-slate-200 bg-white md:hidden">
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3">
        {developerNavLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-600"
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
