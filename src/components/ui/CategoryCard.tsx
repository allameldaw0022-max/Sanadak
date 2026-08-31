import Link from "next/link";
import type { Category } from "@/data/types";
import { CategoryIcon } from "./CategoryIcon";

export function CategoryCard({
  category,
  count,
}: {
  category: Category;
  count?: number;
}) {
  return (
    <Link
      href={`/apps?category=${category.slug}`}
      className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${category.color}1A`, color: category.color }}
      >
        <CategoryIcon name={category.icon} className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm font-bold text-navy">{category.name}</p>
        {count !== undefined && (
          <p className="mt-0.5 text-xs text-slate-500">{count} تطبيق</p>
        )}
      </div>
    </Link>
  );
}
