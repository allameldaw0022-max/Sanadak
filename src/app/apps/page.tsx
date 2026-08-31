import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AppCard } from "@/components/ui/AppCard";
import { cn } from "@/lib/utils";
import {
  getApprovedApps,
  getAppsByCategory,
  getCategories,
  getCategoryBySlug,
} from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "جميع التطبيقات | سندك",
};

export default async function AppsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [categories, activeCategory] = await Promise.all([
    getCategories(),
    category ? getCategoryBySlug(category) : Promise.resolve(undefined),
  ]);
  const filteredApps = activeCategory
    ? await getAppsByCategory(activeCategory.slug)
    : await getApprovedApps();

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">جميع التطبيقات</h1>
        <p className="mt-1 text-sm text-slate-500">
          {activeCategory
            ? `تطبيقات تصنيف "${activeCategory.name}"`
            : "تصفح كل التطبيقات السودانية المتاحة على سندك"}
        </p>
      </div>

      <div className="no-scrollbar mb-8 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/apps"
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            !activeCategory ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200"
          )}
        >
          الكل
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/apps?category=${cat.slug}`}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              activeCategory?.slug === cat.slug
                ? "bg-primary text-white"
                : "bg-white text-slate-600 border border-slate-200"
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {filteredApps.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">لا توجد تطبيقات في هذا التصنيف حاليًا.</p>
        </div>
      )}
    </Container>
  );
}
