import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { HardDrive, Tag, Calendar, User, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AppIcon } from "@/components/ui/AppIcon";
import { Rating } from "@/components/ui/Rating";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { AppCard } from "@/components/ui/AppCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ReviewForm } from "@/components/apps/ReviewForm";
import { ReportAppButton } from "@/components/apps/ReportAppButton";
import {
  getAppBySlug,
  getAppReviews,
  getAppScreenshots,
  getAppSecurityInfo,
  getCategoryBySlug,
  getCurrentUser,
  getMyReviewForApp,
  getSimilarApps,
} from "@/lib/supabase/queries";
import { formatDate, formatDownloads, formatShortDate } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) return { title: "التطبيق غير موجود | سندك" };

  const title = `${app.name} - تحميل التطبيق | سندك`;
  return {
    title,
    description: app.shortDescription,
    alternates: { canonical: `/apps/${app.slug}` },
    openGraph: {
      title,
      description: app.shortDescription,
      type: "website",
      url: `/apps/${app.slug}`,
      ...(app.iconUrl ? { images: [{ url: app.iconUrl }] } : {}),
    },
  };
}

export default async function AppDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) notFound();

  const [category, similarApps, reviews, currentUser, security, screenshotUrls] = await Promise.all([
    getCategoryBySlug(app.categorySlug),
    getSimilarApps(app),
    getAppReviews(app.id),
    getCurrentUser(),
    getAppSecurityInfo(app.id),
    getAppScreenshots(app.id),
  ]);

  const myReview = currentUser ? await getMyReviewForApp(app.id, currentUser.id) : null;

  const infoItems = [
    { icon: User, label: "المطور", value: app.developer },
    { icon: Tag, label: "التصنيف", value: category?.name ?? "—" },
    { icon: HardDrive, label: "الحجم", value: app.size },
    { icon: Calendar, label: "آخر تحديث", value: formatDate(app.lastUpdate) },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    description: app.shortDescription,
    applicationCategory: category?.name,
    operatingSystem: "Android",
    url: `${SITE_URL}/apps/${app.slug}`,
    softwareVersion: app.version,
    author: {
      "@type": "Person",
      name: app.developer,
    },
    ...(app.ratingCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: app.rating,
            ratingCount: app.ratingCount,
          },
        }
      : {}),
  };

  return (
    <Container className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-1 flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-right">
          <AppIcon name={app.name} color={app.iconColor} iconUrl={app.iconUrl} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{app.name}</h1>
            <Link
              href={`/developers/${app.developerId}`}
              className="mt-1 inline-block text-sm text-slate-500 transition-colors hover:text-primary"
            >
              {app.developer}
            </Link>

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

            {app.status === "approved" && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-dark sm:justify-start">
                <ShieldCheck className="h-4 w-4" />
                تمت مراجعة التطبيق من فريق سندك
              </p>
            )}
            {security?.securityStatus === "passed" && (
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-primary-dark sm:justify-start">
                <ShieldCheck className="h-4 w-4" />
                🛡️ تم فحص التطبيق وفق آليات سندك الأمنية
              </p>
            )}
          </div>
        </div>

        <div className="w-full shrink-0 lg:w-72">
          <DownloadButton appId={app.id} apkPath={app.apkPath} />
          <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <div>
              <p className="text-[11px] text-slate-500">الإصدار</p>
              <p className="mt-1 text-sm font-bold text-navy">{app.version}</p>
            </div>
            <div className="border-x border-slate-100">
              <p className="text-[11px] text-slate-500">الحجم</p>
              <p className="mt-1 text-sm font-bold text-navy">{app.size}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">آخر تحديث</p>
              <p className="mt-1 text-sm font-bold text-navy">{formatShortDate(app.lastUpdate)}</p>
            </div>
          </div>
          <div className="mt-3 text-center lg:text-right">
            <ReportAppButton appId={app.id} />
          </div>
        </div>
      </div>

      {screenshotUrls.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-bold text-navy">صور من التطبيق</h2>
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
            {screenshotUrls.map((url, i) => (
              <Image
                key={url}
                src={url}
                alt={`لقطة شاشة ${i + 1} من ${app.name}`}
                width={220}
                height={391}
                loading="lazy"
                className="aspect-[9/16] w-36 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm sm:w-44 lg:w-full"
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold text-navy">حول التطبيق</h2>
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

      <div className="mt-14">
        <h2 className="mb-4 text-lg font-bold text-navy">تقييمات المستخدمين</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ReviewForm
              appId={app.id}
              slug={app.slug}
              isAuthenticated={!!currentUser}
              existingReview={myReview}
            />
          </div>
          <div className="space-y-3 lg:col-span-2">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-10 text-center">
                <p className="text-sm text-slate-500">لا توجد تقييمات بعد. كن أول من يقيّم هذا التطبيق.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-navy">{review.userName}</p>
                    <Rating value={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-400">{formatDate(review.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {similarApps.length > 0 && (
        <div className="mt-14">
          <SectionHeader title="تطبيقات مشابهة" />
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
            {similarApps.map((similarApp) => (
              <AppCard
                key={similarApp.id}
                app={similarApp}
                className="w-44 shrink-0 sm:w-48 md:w-auto"
              />
            ))}
          </div>
        </div>
      )}
    </Container>
  );
}
