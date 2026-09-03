import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { VerifyCertificateForm } from "@/components/devices/VerifyCertificateForm";
import { QrScannerPanel } from "@/components/devices/QrScannerPanel";

export const metadata: Metadata = {
  title: "التحقق من شهادة | سندك",
  description: "تحقق من صحة شهادة ملكية جهاز عبر سندك.",
  alternates: {
    canonical: "/verify",
  },
};

export default function VerifyCertificateIndexPage() {
  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
          <BadgeCheck className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl font-extrabold text-navy sm:text-3xl">التحقق من شهادة جهاز</h1>
        <p className="mt-2 text-sm text-slate-500">
          امسح رمز QR الموجود على الشهادة، أو أدخل معرّفها يدويًا للتحقق من صحتها.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xl space-y-4">
        <QrScannerPanel />

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          أو أدخل المعرّف يدويًا
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <VerifyCertificateForm />
      </div>
    </Container>
  );
}
