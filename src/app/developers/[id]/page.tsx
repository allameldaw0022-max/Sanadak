import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LayoutGrid, Download } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AppCard } from "@/components/ui/AppCard";
import { getDeveloperApps, getDeveloperProfile } from "@/lib/supabase/queries";
import { formatDownloads } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const developer = await getDeveloperProfile(id);
  if (!developer) return { title: "المطور غير موجود | سندك" };
  return { title: `${developer.fullName} | سندك` };
}

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const developer = await getDeveloperProfile(id);
  if (!developer) notFound();

  const apps = await getDeveloperApps(id);
  const publishedApps = apps.filter((app) => app.status === "approved");

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-center sm:flex-row sm:items-center sm:gap-5 sm:p-8 sm:text-right">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-extrabold text-white">
          {developer.fullName.charAt(0)}
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-navy sm:text-2xl">{developer.fullName}</h1>
          <p className="mt-1 text-sm text-slate-500">مطور على منصة سندك</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
            <LayoutGrid className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-navy">{developer.totalApps}</p>
            <p className="text-xs text-slate-500">تطبيق منشور</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Download className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-navy">{formatDownloads(developer.totalDownloads)}</p>
            <p className="text-xs text-slate-500">إجمالي التحميلات</p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-navy">تطبيقات {developer.fullName}</h2>
        {publishedApps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
            <p className="text-sm text-slate-500">لا توجد تطبيقات منشورة لهذا المطور بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {publishedApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
