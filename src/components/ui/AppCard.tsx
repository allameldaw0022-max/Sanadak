import Link from "next/link";
import { Download } from "lucide-react";
import type { AppItem } from "@/data/types";
import { cn, formatDownloads } from "@/lib/utils";
import { AppIcon } from "./AppIcon";
import { Rating } from "./Rating";

export function AppCard({ app, className }: { app: AppItem; className?: string }) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className={cn(
        "group flex flex-col gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <AppIcon name={app.name} color={app.iconColor} iconUrl={app.iconUrl} size="md" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-navy">{app.name}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">{app.developer}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Rating value={app.rating} count={app.ratingCount} />
          <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
            <Download className="h-3.5 w-3.5" />
            {formatDownloads(app.downloads)}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-primary-light px-3.5 py-1.5 text-xs font-bold text-primary-dark transition-colors group-hover:bg-primary group-hover:text-white">
          عرض
        </span>
      </div>
    </Link>
  );
}
