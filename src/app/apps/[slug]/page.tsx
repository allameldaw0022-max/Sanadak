import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HardDrive, Tag, Calendar, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AppIcon } from "@/components/ui/AppIcon";
import { Rating } from "@/components/ui/Rating";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { Screenshot } from "@/components/ui/Screenshot";
import { AppCard } from "@/components/ui/AppCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { apps, getAppBySlug, getSimilarApps } from "@/data/apps";
import { getCategoryBySlug } from "@/data/categories";
import { formatDate, formatDownloads } from "@/lib/utils";

export function generateStaticParams() {
  return apps.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = getAppBySlug(slug);
  if (!app) return { title: "التطبيق غير موجود | سندك" };
  return { title: `${app.name} | سندك`, description: app.shortDescription };
}

export default async function AppDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = getAppBySlug(slug);
  if (!app) notFound();

  const category = getCategoryBySlug(app.categorySlug);
  const similarApps = getSimilarApps(app);

  const infoItems = [
    { icon: User, label: "المطور", value: app.developer },
    { icon: Tag, label: "التصنيف", value: category?.name ?? "—" },
    { icon: HardDrive, label: "الحجم", value: app.size },
    { icon: Calendar, label: "آخر تحديث", value: formatDate(app.lastUpdate) },
  ];

  return (
    <Container className="py-8 sm:py-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-right">
          <AppIcon name={app.name} color={app.iconColor} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{app.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{app.developer}</p>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              {category && (
                <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark">
                  {category.name}
                </span>
              )}
              <Rating value={app.rating} count={app.ratingCount} size="md" />
              <span className="text-xs font-medium text-slate-500">
                {formatDownloads(app.downloads)} تحميل
              </span>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-72">
          <DownloadButton />
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <div>
              <p className="text-xs text-slate-500">الإصدار</p>
              <p className="mt-1 text-sm font-bold text-navy">{app.version}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">الحجم</p>
              <p className="mt-1 text-sm font-bold text-navy">{app.size}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-navy">صور من التطبيق</h2>
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: app.screenshotsCount }).map((_, i) => (
            <Screenshot key={i} color={app.iconColor} index={i + 1} />
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-navy">وصف التطبيق</h2>
          <p className="text-sm leading-relaxed text-slate-600">{app.description}</p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-navy">معلومات التطبيق</h2>
          <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="flex items-center gap-2 text-xs text-slate-500">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </dt>
                <dd className="truncate text-sm font-semibold text-navy">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {similarApps.length > 0 && (
        <div className="mt-14">
          <SectionHeader title="تطبيقات مشابهة" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similarApps.map((similarApp) => (
              <AppCard key={similarApp.id} app={similarApp} />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
