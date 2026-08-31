import Link from "next/link";
import { Rocket, PackageOpen } from "lucide-react";
import { HeroSection } from "@/components/ui/HeroSection";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Container } from "@/components/ui/Container";
import { AppCard } from "@/components/ui/AppCard";
import { CategoryCard } from "@/components/ui/CategoryCard";
import {
  getCategories,
  getCategoryCounts,
  getFeaturedApps,
  getLatestApps,
  getMostDownloadedApps,
} from "@/lib/supabase/queries";

function AppRow({ apps }: { apps: Awaited<ReturnType<typeof getFeaturedApps>> }) {
  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center">
        <p className="text-sm text-slate-500">لا توجد تطبيقات هنا بعد.</p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} className="w-44 shrink-0 sm:w-48 md:w-auto" />
      ))}
    </div>
  );
}

export default async function HomePage() {
  const [categories, categoryCounts, featuredApps, latestApps, mostDownloaded] =
    await Promise.all([
      getCategories(),
      getCategoryCounts(),
      getFeaturedApps(8),
      getLatestApps(8),
      getMostDownloadedApps(8),
    ]);

  const catalogIsEmpty =
    featuredApps.length === 0 && latestApps.length === 0 && mostDownloaded.length === 0;

  return (
    <>
      <HeroSection />

      <Container className="space-y-12 py-8 sm:py-12">
        {catalogIsEmpty ? (
          <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <PackageOpen className="h-7 w-7" />
            </span>
            <h2 className="text-lg font-bold text-navy">سندك بانتظار أول تطبيق</h2>
            <p className="max-w-sm text-sm text-slate-500">
              لم يُنشر أي تطبيق بعد. كن أول مطور سوداني ينشر تطبيقه على سندك.
            </p>
            <Link
              href="/developer/register"
              className="mt-2 flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
            >
              ابدأ كمطور
            </Link>
          </section>
        ) : (
          <>
            <section>
              <SectionHeader title="تطبيقات مميزة" href="/apps" />
              <AppRow apps={featuredApps} />
            </section>

            <section>
              <SectionHeader title="الأكثر تحميلًا" href="/apps" />
              <AppRow apps={mostDownloaded} />
            </section>

            <section>
              <SectionHeader title="أحدث التطبيقات" href="/apps" />
              <AppRow apps={latestApps} />
            </section>
          </>
        )}

        <section>
          <SectionHeader title="تصنيفات التطبيقات" href="/categories" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.slug}
                category={category}
                count={categoryCounts[category.slug] ?? 0}
              />
            ))}
          </div>
        </section>
      </Container>

      <section className="border-t border-slate-200 bg-navy">
        <Container className="flex flex-col items-center gap-5 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Rocket className="h-6 w-6" />
          </span>
          <h2 className="max-w-xl text-balance text-2xl font-extrabold text-white sm:text-3xl">
            عندك تطبيق سوداني؟ خليه يوصل لمستخدمين أكثر
          </h2>
          <p className="max-w-lg text-balance text-sm leading-relaxed text-slate-300 sm:text-base">
            انضم لسندك كمطور وانشر تطبيقك ليصل إلى آلاف المستخدمين السودانيين بسهولة.
          </p>
          <Link
            href="/developer/register"
            className="flex h-12 items-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
          >
            أضف تطبيقك
          </Link>
        </Container>
      </section>
    </>
  );
}
