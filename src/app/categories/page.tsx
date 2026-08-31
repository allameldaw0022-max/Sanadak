import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { getCategories, getCategoryCounts } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "التصنيفات | سندك",
};

export default async function CategoriesPage() {
  const [categories, categoryCounts] = await Promise.all([
    getCategories(),
    getCategoryCounts(),
  ]);

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">التصنيفات</h1>
        <p className="mt-1 text-sm text-slate-500">تصفح التطبيقات حسب التصنيف الذي يناسبك</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.slug}
            category={category}
            count={categoryCounts[category.slug] ?? 0}
          />
        ))}
      </div>
    </Container>
  );
}
