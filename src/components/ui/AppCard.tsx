import Link from "next/link";
import { Download } from "lucide-react";
import type { AppItem } from "@/data/types";
import { getCategoryBySlug } from "@/data/categories";
import { formatDownloads } from "@/lib/utils";
import { AppIcon } from "./AppIcon";
import { Rating } from "./Rating";

export function AppCard({ app }: { app: AppItem }) {
  const category = getCategoryBySlug(app.categorySlug);

  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <AppIcon name={app.name} color={app.iconColor} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-navy">{app.name}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">{app.developer}</p>
          {category && (
            <span className="mt-1.5 inline-block rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary-dark">
              {category.name}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
        {app.shortDescription}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <div className="flex items-center gap-3">
          <Rating value={app.rating} />
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Download className="h-3.5 w-3.5" />
            {formatDownloads(app.downloads)}
          </span>
        </div>
        <span className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-primary">
          عرض التطبيق
        </span>
      </div>
    </Link>
  );
}
