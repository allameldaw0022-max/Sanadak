import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { CheckCircle2, XCircle, ShieldQuestion, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { logSecurityEvent } from "@/lib/security/audit";
import { Container } from "@/components/ui/Container";
import { formatDate, cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "التحقق من الشهادة | سندك",
  robots: { index: false },
};

// Same per-file getClientIp() pattern already used by
// devices/actions.ts, devices/reports/actions.ts, devices/claims/actions.ts,
// and devices/batch-check/actions.ts -- not extracted into a shared helper,
// to match the existing convention rather than introduce a new one.
async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return headerList.get("x-forwarded-for") ?? "unknown";
}

// Public, no-auth page. verify_certificate is the ONLY thing this page
// reads -- its returns table clause only ever carries brand/model/
// issued_at/valid (see the certificates_dealers migration), so there is no
// code path here that could leak an owner, IMEI, serial number, or
// internal device id even by accident.
export default async function VerifyCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // IP-based only (no per-user limit): this page is meant to be opened by
  // anyone, signed in or not, so the IP counter is the one that actually
  // matters here -- same reasoning as IMEI_CHECK_PER_IP, just without the
  // paired per-user counter since this path has no signed-in-only cost
  // concern the way batch IMEI checks do. Counted before the RPC call, same
  // as checkImeiAction, so it applies uniformly regardless of whether the
  // id turns out to exist.
  const ip = await getClientIp();
  const rate = await checkRateLimit(
    `certificate-verify:ip:${ip}`,
    RATE_LIMITS.CERTIFICATE_VERIFY_PER_IP.limit,
    RATE_LIMITS.CERTIFICATE_VERIFY_PER_IP.windowSeconds
  );

  if (!rate.allowed) {
    return (
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Clock className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-3 text-lg font-extrabold text-navy">حاول لاحقًا</h1>
          <p className="mt-1 text-sm text-slate-500">
            لقد تجاوزت الحد المسموح به لعمليات التحقق خلال فترة قصيرة، حاول مرة أخرى بعد قليل.
          </p>
          <Link
            href="/verify"
            className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark"
          >
            العودة
          </Link>
        </div>
      </Container>
    );
  }

  const { data } = await supabase.rpc("verify_certificate", { p_certificate_id: id });
  const record = data?.[0] ?? null;

  if (record?.valid) {
    try {
      // No metadata: nothing about a specific certificate (id, brand,
      // model, owner) belongs in this event -- it exists purely to count
      // "a real verification of a valid certificate happened", nothing
      // more. A failure here must never affect what the user sees below.
      await logSecurityEvent({
        eventType: "certificate_verified",
        actorId: user?.id ?? null,
        actorRole: user ? "authenticated" : "anonymous",
      });
    } catch {
      // Logging is best-effort only -- verification result already computed.
    }
  }

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
