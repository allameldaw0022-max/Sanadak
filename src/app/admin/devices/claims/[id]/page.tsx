import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { getAdminClaimById } from "@/lib/supabase/queries";
import { ClaimStatusBadge } from "@/components/devices/ClaimStatusBadge";
import { DeviceCaseReviewForm } from "@/components/admin/DeviceCaseReviewForm";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "مراجعة مطالبة ملكية | سندك",
};

export default async function AdminClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const claim = await getAdminClaimById(id);
  if (!claim) notFound();

  const isClosed = claim.status === "APPROVED" || claim.status === "REJECTED";

  return (
    <div>
      <Link
        href="/admin/devices/claims"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        مطالبات الملكية
      </Link>

      <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-extrabold text-navy">
              {claim.deviceBrand} {claim.deviceModel}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">مقدّم الطلب: {claim.claimantEmail ?? "—"}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              قُدّمت في {formatDateTime(claim.createdAt)} · آخر تحديث {formatDateTime(claim.updatedAt)}
            </p>
          </div>
          <ClaimStatusBadge status={claim.status} />
        </div>

        {claim.note && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-navy">
            <p className="text-xs font-semibold text-slate-500">ملاحظة مقدّم الطلب</p>
            <p className="mt-1">{claim.note}</p>
          </div>
        )}

        <div className="mt-4">
          <h2 className="mb-2 text-sm font-bold text-navy">الأدلة</h2>
          {claim.evidence.length === 0 ? (
            <p className="text-xs text-slate-400">لا توجد أدلة مرفقة.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {claim.evidence.map((e) =>
                e.signedUrl ? (
                  <a
                    key={e.id}
                    href={e.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative block aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <Image src={e.signedUrl} alt="دليل ملكية" fill className="object-cover" unoptimized />
                  </a>
                ) : (
                  <div
                    key={e.id}
                    className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-300"
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {isClosed ? (
          <p className="mt-4 text-xs text-slate-400">تم إغلاق هذه المطالبة نهائيًا.</p>
        ) : (
          <DeviceCaseReviewForm kind="claim" id={claim.id} />
        )}
      </div>
    </div>
  );
}
