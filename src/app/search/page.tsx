import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SearchBar } from "@/components/ui/SearchBar";
import { AppCard } from "@/components/ui/AppCard";
import { searchApps } from "@/data/apps";

export const metadata: Metadata = {
  title: "البحث | سندك",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = searchApps(q);

  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">ابحث عن تطبيقك</h1>
        <p className="mt-1 text-sm text-slate-500">
          ابحث باسم التطبيق أو اسم المطور أو الوصف
        </p>
        <SearchBar defaultValue={q} className="mt-6" autoFocus />
      </div>

      <div className="mt-10">
        {q.trim() === "" ? (
          <p className="text-center text-sm text-slate-400">اكتب كلمة للبدء في البحث</p>
        ) : results.length > 0 ? (
          <>
            <p className="mb-5 text-sm text-slate-500">
              {results.length} نتيجة لـ «{q}»
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <SearchX className="h-7 w-7" />
            </span>
            <p className="text-sm text-slate-500">لا توجد نتائج مطابقة لـ «{q}»</p>
          </div>
        )}
      </div>
    </Container>
  );
}
