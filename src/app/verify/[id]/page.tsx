import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, ShieldQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "التحقق من الشهادة | سندك",
  robots: { index: false },
};

// Public, no-auth page. verify_certificate is the ONLY thing this page
// reads -- its returns table clause only ever carries brand/model/
// issued_at/valid (see the certificates_dealers migration), so there is no
// code path here that could leak an owner, IMEI, serial number, or
// internal device id even by accident.
export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("verify_certificate", { p_certificate_id: id });
  const record = data?.[0] ?? null;

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        {!record ? (
          <>
            <ShieldQuestion className="mx-auto h-12 w-12 text-slate-300" />
            <h1 className="mt-3 text-lg font-extrabold text-navy">شهادة غير موجودة</h1>
            <p className="mt-1 text-sm text-slate-500">لم يتم العثور على شهادة بهذا المعرّف.</p>
          </>
        ) : (
          <>
            {record.valid ? (
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            ) : (
              <XCircle className="mx-auto h-12 w-12 text-red-500" />
            )}
            <h1 className="mt-3 text-lg font-extrabold text-navy">
              {record.brand} {record.model}
            </h1>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                record.valid ? "bg-primary-light text-primary-dark" : "bg-red-50 text-red-600"
              )}
            >
              {record.valid ? "شهادة سارية وصادرة عن سندك" : "شهادة غير سارية حاليًا"}
            </span>
            <p className="mt-2 text-xs text-slate-400">صدرت في {formatDate(record.issued_at)}</p>
          </>
        )}

        <Link
          href="/verify"
          className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          تحقق من شهادة أخرى
        </Link>
      </div>
    </Container>
  );
}
