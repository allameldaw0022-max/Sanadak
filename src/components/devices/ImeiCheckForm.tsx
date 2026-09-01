"use client";

import { useState, useTransition, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, ShieldAlert, ShieldQuestion } from "lucide-react";
import { checkImeiAction } from "@/app/devices/actions";
import { isValidImei, normalizeImei } from "@/lib/devices/imei-format";
import { cn } from "@/lib/utils";

// The exact status keys checkImeiAction's disclosure can carry when
// disclosed:true (everything except BLOCKED, which is never disclosed).
const STATUS_STYLES: Record<string, { icon: typeof CheckCircle2; className: string }> = {
  ACTIVE: { icon: CheckCircle2, className: "border-primary/30 bg-primary-light/40 text-primary-dark" },
  UNDER_REVIEW: { icon: HelpCircle, className: "border-amber-200 bg-amber-50 text-amber-700" },
  LOST: { icon: ShieldQuestion, className: "border-orange-200 bg-orange-50 text-orange-700" },
  STOLEN: { icon: ShieldAlert, className: "border-red-200 bg-red-50 text-red-600" },
  RECOVERED: { icon: CheckCircle2, className: "border-sky-200 bg-sky-50 text-sky-700" },
};

type ResultState =
  | { kind: "disclosed"; status: string; message: string }
  | { kind: "hidden"; message: string }
  | { kind: "error"; message: string };

// IMEI is passed to checkImeiAction as a plain Server Action argument, not
// a query string or GET param -- it never touches the URL, browser history,
// or a referrer header.
export function ImeiCheckForm() {
  const [imei, setImei] = useState("");
  const [formatError, setFormatError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);

    // Instant, non-authoritative client-side format check for a snappier
    // UX only -- checkImeiAction re-validates format server-side regardless,
    // and this uses imei-format.ts only (no HMAC/secret logic in the
    // browser).
    const normalized = normalizeImei(imei);
    if (!isValidImei(normalized)) {
      setFormatError("رقم IMEI غير صالح. تأكد من إدخال 15 رقمًا صحيحًا.");
      return;
    }
    setFormatError(null);

    startTransition(async () => {
      const res = await checkImeiAction(imei);
      if (!res.ok) {
        setResult({ kind: "error", message: res.error });
        return;
      }
      if (res.result.disclosed) {
        setResult({ kind: "disclosed", status: res.result.status, message: res.result.message });
      } else {
        setResult({ kind: "hidden", message: res.result.message });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={imei}
          onChange={(e) => {
            setImei(e.target.value);
            setFormatError(null);
          }}
          placeholder="أدخل رقم IMEI المكوّن من 15 رقمًا"
          maxLength={20}
          className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:text-left"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "جارٍ الفحص..." : "افحص الآن"}
        </button>
      </form>

      {formatError && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {formatError}
        </p>
      )}

      {result?.kind === "error" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {result.message}
        </p>
      )}

      {result?.kind === "hidden" && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
          <HelpCircle className="h-5 w-5 shrink-0" />
          {result.message}
        </div>
      )}

      {result?.kind === "disclosed" &&
        (() => {
          const style = STATUS_STYLES[result.status] ?? STATUS_STYLES.UNDER_REVIEW;
          const Icon = style.icon;
          return (
            <div className={cn("mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold", style.className)}>
              <Icon className="h-5 w-5 shrink-0" />
              {result.message}
            </div>
          );
        })()}
    </div>
  );
}
