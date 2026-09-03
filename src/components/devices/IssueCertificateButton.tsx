"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BadgeCheck, AlertCircle, Info } from "lucide-react";
import { issueCertificateAction } from "@/app/devices/certificates/actions";
import type { Database } from "@/lib/supabase/database.types";

type DeviceStatus = Database["public"]["Enums"]["device_status"];

// Exactly the statuses verify_certificate/getMy*Certificate* already treat
// as "valid" (see the certificates_dealers migration) -- kept in sync with
// that same live-computed rule so a device that isn't eligible here would
// never end up with a certificate reading "غير سارية" the moment it's
// issued. This is a UX-only gate: RLS (device_certificates_insert_own_device)
// is still the real enforcement, unchanged.
const ELIGIBLE_STATUSES = new Set<DeviceStatus>(["ACTIVE", "RECOVERED"]);

const INELIGIBLE_MESSAGES: Partial<Record<DeviceStatus, string>> = {
  UNDER_REVIEW: "الجهاز قيد المراجعة حاليًا. يمكنك إصدار الشهادة بعد اكتمال المراجعة.",
  LOST: "لا يمكن إصدار شهادة لجهاز مُبلَّغ عنه كمفقود.",
  STOLEN: "لا يمكن إصدار شهادة لجهاز مُبلَّغ عنه كمسروق.",
  BLOCKED: "لا يمكن إصدار شهادة لهذا الجهاز في حالته الحالية.",
};

export function IssueCertificateButton({
  deviceId,
  deviceStatus,
  existingCertificateId,
}: {
  deviceId: string;
  deviceStatus: DeviceStatus;
  existingCertificateId: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (existingCertificateId) {
    return (
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary-dark">
          <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
          لديك شهادة ملكية صادرة لهذا الجهاز
        </p>
        <Link
          href={`/devices/certificates/${existingCertificateId}`}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary-light/40 text-sm font-bold text-primary-dark transition-colors hover:bg-primary-light"
        >
          <BadgeCheck className="h-4 w-4" />
          عرض الشهادة
        </Link>
      </div>
    );
  }

  if (!ELIGIBLE_STATUSES.has(deviceStatus)) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-xs font-medium text-slate-600">
          {INELIGIBLE_MESSAGES[deviceStatus] ?? "لا يمكن إصدار شهادة لهذا الجهاز في حالته الحالية."}
        </p>
      </div>
    );
  }

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await issueCertificateAction(deviceId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/devices/certificates/${result.certificateId}`);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary-light/40 text-sm font-bold text-primary-dark transition-colors hover:bg-primary-light disabled:opacity-60"
      >
        <BadgeCheck className="h-4 w-4" />
        {pending ? "جارٍ الإصدار..." : "إصدار شهادة ملكية (QR)"}
      </button>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
