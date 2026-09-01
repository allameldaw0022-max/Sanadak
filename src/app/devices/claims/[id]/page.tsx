import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { ArrowRight, Smartphone, FileText, MessageSquareWarning } from "lucide-react";
import { getCurrentUser, getMyClaimById } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { ClaimStatusBadge } from "@/components/devices/ClaimStatusBadge";
import { ClaimEvidenceUpload } from "@/components/devices/ClaimEvidenceUpload";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "تفاصيل المطالبة | سندك",
};

const CLOSED_STATUSES = new Set(["APPROVED", "REJECTED"]);

export default async function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const claim = await getMyClaimById(user.id, id);
  if (!claim) notFound();

  const isClosed = CLOSED_STATUSES.has(claim.status);

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href="/devices/claims"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        مطالباتي
      </Link>

      <div className="mx-auto max-w-lg space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                <Smartphone className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-lg font-extrabold text-navy">
                  {claim.deviceBrand} {claim.deviceModel}
                </h1>
                {claim.deviceColor && <p className="text-xs text-slate-500">{claim.deviceColor}</p>}
              </div>
            </div>
            <ClaimStatusBadge status={claim.status} />
          </div>

          <p className="mt-3 text-[11px] text-slate-400">
            قُدّمت في {formatDate(claim.createdAt)} · آخر تحديث {formatDate(claim.updatedAt)}
          </p>

          {claim.note && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">ملاحظتك</p>
              <p className="mt-1 text-sm text-navy">{claim.note}</p>
            </div>
          )}

          {claim.status === "MORE_INFORMATION_REQUIRED" && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-orange-700">
              <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0" />
              <p>الإدارة طلبت معلومات أو أدلة إضافية لمراجعة مطالبتك. أضف الأدلة المطلوبة أدناه.</p>
            </div>
          )}

          {claim.status === "REJECTED" && claim.rejectionReason && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              <p className="font-semibold">سبب الرفض</p>
              <p className="mt-1">{claim.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-3 text-sm font-bold text-navy">الأدلة المرفقة</h2>

          {claim.evidence.length === 0 ? (
            <p className="text-xs text-slate-400">لم تُرفق أي أدلة بعد.</p>
          ) : (
            <div className="mb-4 grid grid-cols-3 gap-2">
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
                    <FileText className="h-6 w-6" />
                  </div>
                )
              )}
            </div>
          )}

          {isClosed ? (
            <p className="text-[11px] text-slate-400">تم إغلاق هذه المطالبة، لا يمكن إضافة أدلة جديدة.</p>
          ) : (
            <ClaimEvidenceUpload claimId={claim.id} />
          )}
        </div>
      </div>
    </Container>
  );
}
