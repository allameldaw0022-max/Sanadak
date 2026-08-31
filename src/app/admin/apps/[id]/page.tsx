import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AppIcon } from "@/components/ui/AppIcon";
import { StatusBadge } from "@/components/ui/Badge";
import { DownloadButton } from "@/components/ui/DownloadButton";
import { RejectAppButton } from "@/components/admin/RejectAppButton";
import { getAdminAppById } from "@/lib/supabase/queries";
import { formatDate } from "@/lib/utils";
import { approveAppAction } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "مراجعة تطبيق | سندك",
};

export default async function AdminAppDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const app = await getAdminAppById(id);
  if (!app) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/apps"
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        العودة لكل التطبيقات
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <AppIcon name={app.name} color={app.iconColor} size="md" />
            <div>
              <h1 className="text-xl font-extrabold text-navy">{app.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {app.developerName}
                {app.developerEmail ? ` · ${app.developerEmail}` : ""}
              </p>
              <div className="mt-2">
                <StatusBadge status={app.status} />
              </div>
            </div>
          </div>

          {app.status === "pending" && (
            <div className="flex shrink-0 gap-2">
              <form action={approveAppAction}>
                <input type="hidden" name="appId" value={app.id} />
                <button
                  type="submit"
                  className="flex h-11 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  اعتماد التطبيق
                </button>
              </form>
              <RejectAppButton
                appId={app.id}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
              />
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-bold text-navy">الوصف</h2>
            <p className="text-sm leading-relaxed text-slate-600">{app.description}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">التصنيف</span>
              <span className="font-semibold text-navy">{app.categoryName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">الإصدار</span>
              <span className="font-semibold text-navy">{app.version}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">حجم APK</span>
              <span className="font-semibold text-navy">{app.size}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Screenshots</span>
              <span className="font-semibold text-navy">{app.screenshotsCount}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">تاريخ الرفع</span>
              <span className="font-semibold text-navy">{formatDate(app.createdAt)}</span>
            </div>
            {app.reviewedAt && (
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">تاريخ المراجعة</span>
                <span className="font-semibold text-navy">{formatDate(app.reviewedAt)}</span>
              </div>
            )}
            {app.reviewerName && (
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">تمت المراجعة بواسطة</span>
                <span className="font-semibold text-navy">{app.reviewerName}</span>
              </div>
            )}
          </div>
        </div>

        {app.status === "rejected" && app.rejectionReason && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs font-bold text-red-700">سبب الرفض</p>
            <p className="mt-1 text-sm text-red-600">{app.rejectionReason}</p>
          </div>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="mb-3 text-sm font-bold text-navy">ملف APK</h2>
          <div className="max-w-xs">
            <DownloadButton appId={app.id} apkPath={app.apkPath} size="md" />
          </div>
        </div>
      </div>
    </div>
  );
}
