import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { PaymentReviewActions } from "@/components/admin/PaymentReviewActions";
import { getAdminPaymentRequestById } from "@/lib/supabase/queries";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { planPickLabels, paymentStatusLabels, paymentStatusStyles } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "مراجعة دفعة | سندك",
};

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getAdminPaymentRequestById(id);
  if (!request) notFound();

  const isImage = request.proofSignedUrl && !request.proofSignedUrl.split("?")[0].toLowerCase().endsWith(".pdf");

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/payments"
        className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        العودة لكل المدفوعات
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-navy">{request.developerName}</h1>
            <p className="mt-1 text-sm text-slate-500">{request.developerEmail}</p>
            <div className="mt-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
                  paymentStatusStyles[request.status]
                )}
              >
                {paymentStatusLabels[request.status]}
              </span>
            </div>
          </div>

          {request.status === "pending" && (
            <div className="w-full shrink-0 sm:w-64">
              <PaymentReviewActions requestId={request.id} />
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">الخطة</span>
              <span className="font-semibold text-navy">{planPickLabels[request.plan as "basic" | "pro"]}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">المبلغ (USD)</span>
              <span className="font-semibold text-navy">${request.amountUsd.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">سعر الصرف وقت الطلب</span>
              <span className="font-semibold text-navy">1 USD = {request.exchangeRate.toLocaleString("en-US")} SDG</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">المبلغ (SDG)</span>
              <span className="font-semibold text-navy">{request.amountSdg.toLocaleString("en-US")}</span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">اسم المُحوِّل</span>
              <span className="font-semibold text-navy">{request.payerName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">رقم العملية</span>
              <span className="font-semibold text-navy">{request.transactionReference}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">تاريخ التحويل</span>
              <span className="font-semibold text-navy">{request.transferDate}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">تاريخ الطلب</span>
              <span className="font-semibold text-navy">{formatDateTime(request.createdAt)}</span>
            </div>
          </div>
        </div>

        {request.note && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-bold text-navy">ملاحظة المطور</p>
            <p className="mt-1 text-sm text-slate-600">{request.note}</p>
          </div>
        )}

        {request.status !== "pending" && (
          <div className="mt-6 rounded-xl border border-slate-100 p-4">
            <p className="text-xs font-bold text-navy">نتيجة المراجعة</p>
            <p className="mt-1 text-sm text-slate-600">
              {request.reviewedByName && `بواسطة ${request.reviewedByName}`}
              {request.reviewedAt && ` · ${formatDate(request.reviewedAt)}`}
            </p>
            {request.adminNote && (
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold text-navy">ملاحظة الإدارة:</span> {request.adminNote}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="mb-3 text-sm font-bold text-navy">إشعار التحويل</h2>
          {request.proofSignedUrl ? (
            isImage ? (
              <a
                href={request.proofSignedUrl}
                target="_blank"
                rel="noreferrer"
                className="block max-w-xs overflow-hidden rounded-xl border border-slate-200"
              >
                <Image
                  src={request.proofSignedUrl}
                  alt="إشعار التحويل"
                  width={320}
                  height={400}
                  unoptimized
                  className="h-auto w-full object-cover"
                />
              </a>
            ) : (
              <a
                href={request.proofSignedUrl}
                target="_blank"
                rel="noreferrer"
                className="flex max-w-xs items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-primary-dark hover:bg-slate-100"
              >
                <FileText className="h-5 w-5" />
                فتح ملف PDF
              </a>
            )
          ) : (
            <p className="text-sm text-slate-500">تعذر تحميل الإشعار.</p>
          )}
        </div>
      </div>
    </div>
  );
}
