import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { categories } from "@/data/categories";
import { getAppsByCategory } from "@/data/apps";

export const metadata: Metadata = {
  title: "التصنيفات | سندك",
};

export default function CategoriesPage() {
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
            count={getAppsByCategory(category.slug).length}
          />
        ))}
      </div>
    </Container>
  );
}
