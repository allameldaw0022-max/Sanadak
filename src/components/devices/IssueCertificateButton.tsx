"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, AlertCircle } from "lucide-react";
import { issueCertificateAction } from "@/app/devices/certificates/actions";

export function IssueCertificateButton({ deviceId }: { deviceId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
