"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileSearch } from "lucide-react";
import { submitOwnershipClaimAction } from "@/app/devices/claims/actions";
import { isValidImei, normalizeImei } from "@/lib/devices/imei-format";
import { consumeImeiHandoff } from "@/lib/devices/imei-handoff";

// Client-side pre-check uses imei-format.ts only (no secret). The IMEI is
// resolved to a device server-side by submit_ownership_claim -- this form
// never learns or sends a device_id.
export function OwnershipClaimForm() {
  const router = useRouter();
  const [imei, setImei] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // One-time prefill from an IMEI check's "هل هذا جهازك؟" CTA, if any -- see
  // imei-handoff.ts. Never a query param (the IMEI must not appear in the
  // URL), and consumeImeiHandoff() clears it immediately so it's never
  // reapplied on a later visit. Still just a starting value for a plain,
  // editable text input -- submitOwnershipClaimAction re-validates and
  // re-hashes everything server-side regardless of where it came from.
  useEffect(() => {
    const handoff = consumeImeiHandoff();
    if (!handoff) return;
    // Deferred a tick rather than calling setState synchronously in the
    // effect body -- same pattern as the login page's resend-cooldown
    // timer, avoids react-hooks/set-state-in-effect.
    const id = setTimeout(() => setImei(handoff), 0);
    return () => clearTimeout(id);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValidImei(normalizeImei(imei))) {
      setError("رقم IMEI غير صالح. تأكد من إدخال 15 رقمًا صحيحًا.");
      return;
    }

    startTransition(async () => {
      const result = await submitOwnershipClaimAction({ imei, note: note.trim() || null });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/devices/claims/${result.claimId}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
          <FileSearch className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-extrabold text-navy">تقديم مطالبة ملكية</h1>
          <p className="text-xs text-slate-500">أدخل رقم IMEI الخاص بالجهاز الذي تملكه</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">IMEI</label>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            placeholder="15 رقمًا"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">ملاحظة (اختياري)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="اشرح كيف حصلت على الجهاز (مثال: اشتريته مستعملًا من...)"
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "جارٍ الإرسال..." : "تقديم المطالبة"}
      </button>

      <p className="mt-3 text-center text-[11px] text-slate-400">
        بعد التقديم يمكنك رفع أدلة تثبت ملكيتك ومتابعة حالة المطالبة.
      </p>
    </form>
  );
}
