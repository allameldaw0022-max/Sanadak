import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { getCurrentUser, getMyCertificateById } from "@/lib/supabase/queries";
import { Container } from "@/components/ui/Container";
import { generateQrDataUrl } from "@/lib/certificates/qr";
import { SITE_URL } from "@/lib/site";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "شهادة الجهاز | سندك",
};

export default async function CertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const certificate = await getMyCertificateById(user.id, id);
  if (!certificate) notFound();

  const verifyUrl = `${SITE_URL}/verify/${certificate.id}`;
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  return (
    <Container className="py-8 sm:py-12">
      <Link
        href="/devices/certificates"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-navy"
      >
        <ArrowRight className="h-4 w-4" />
        شهاداتي
      </Link>

      <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
          <BadgeCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-3 text-lg font-extrabold text-navy">
          {certificate.deviceBrand} {certificate.deviceModel}
        </h1>
        <span
          className={cn(
            "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
            certificate.valid ? "bg-primary-light text-primary-dark" : "bg-slate-100 text-slate-500"
          )}
        >
          {certificate.valid ? "شهادة سارية" : "شهادة غير سارية حاليًا"}
        </span>
        <p className="mt-1 text-xs text-slate-400">صدرت في {formatDate(certificate.issuedAt)}</p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="رمز QR للتحقق" className="mx-auto mt-5 h-48 w-48 rounded-xl border border-slate-100" />

        <p className="mt-3 break-all text-[11px] text-slate-400" dir="ltr">
          {verifyUrl}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          يمكن لأي شخص مسح رمز QR أو زيارة الرابط للتحقق من صحة هذه الشهادة دون الحاجة لتسجيل الدخول.
        </p>
      </div>
    </Container>
  );
}
