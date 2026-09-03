"use client";

import { useState, useTransition, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, HelpCircle, RefreshCw, ShieldAlert, ShieldQuestion, WifiOff } from "lucide-react";
import { checkImeiAction } from "@/app/devices/actions";
import { isValidImei, normalizeImei } from "@/lib/devices/imei-format";
import { isNetworkFailure, OFFLINE_MESSAGE } from "@/lib/network";
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

// "حالة الجهاز" value shown in the detail list below the summary banner --
// distinct from the banner's own sentence (STATUS_STYLES' companion
// message in check-response.ts), which stays as-is.
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "سليم",
  UNDER_REVIEW: "قيد المراجعة",
  LOST: "مفقود (تم الإبلاغ عنه)",
  STOLEN: "مسروق (تم الإبلاغ عنه)",
  RECOVERED: "مستعاد",
};

type ResultState =
  | { kind: "disclosed"; status: string; message: string; ownerDisplayName: string | null }
  | { kind: "hidden"; message: string }
  | { kind: "error"; message: string }
  | { kind: "offline" };

// IMEI is passed to checkImeiAction as a plain Server Action argument, not
// a query string or GET param -- it never touches the URL, browser history,
// or a referrer header.
export function ImeiCheckForm() {
  const [imei, setImei] = useState("");
  const [formatError, setFormatError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [pending, startTransition] = useTransition();

  function runCheck(value: string) {
    startTransition(async () => {
      // Never let a stale result linger while a fresh check is in flight --
      // and a failure below (offline/error) replaces it too, so the UI can
      // never end up showing an old "disclosed" result next to a request
      // that actually failed.
      try {
        const res = await checkImeiAction(value);
        if (!res.ok) {
          setResult({ kind: "error", message: res.error });
          return;
        }
        if (res.result.disclosed) {
          setResult({
            kind: "disclosed",
            status: res.result.status,
            message: res.result.message,
            ownerDisplayName: res.result.ownerDisplayName,
          });
        } else {
          setResult({ kind: "hidden", message: res.result.message });
        }
      } catch (err) {
        // The Server Action call itself failed to reach the server (dropped
        // connection, no network) -- distinct from res.ok === false, which
        // means the server responded but rejected the request.
        setResult(isNetworkFailure(err) ? { kind: "offline" } : { kind: "error", message: "تعذر تنفيذ الفحص حاليًا، حاول مرة أخرى." });
      }
    });
  }

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

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setResult({ kind: "offline" });
      return;
    }

    runCheck(imei);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          inputMode="numeric"
          dir="ltr"
          aria-label="رقم IMEI"
          aria-invalid={!!formatError}
          aria-describedby={formatError ? "imei-check-error" : undefined}
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
        <p id="imei-check-error" role="alert" className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {formatError}
        </p>
      )}

      <div aria-live="polite">
      {result?.kind === "error" && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {result.message}
        </p>
      )}

      {result?.kind === "offline" && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
          <WifiOff className="h-5 w-5 text-slate-400" />
          <p className="text-sm font-semibold text-slate-600">{OFFLINE_MESSAGE}</p>
          <button
            type="button"
            onClick={() => runCheck(imei)}
            disabled={pending}
            className="mt-1 flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {pending ? "جارٍ إعادة المحاولة..." : "إعادة المحاولة"}
          </button>
        </div>
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
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className={cn("flex items-center gap-2 border-b px-4 py-3 text-sm font-bold", style.className)}>
                <Icon className="h-5 w-5 shrink-0" />
                {result.message}
              </div>
              <dl className="divide-y divide-slate-100 bg-white px-4 text-sm">
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500">حالة الجهاز</dt>
                  <dd className="font-semibold text-navy">{STATUS_LABELS[result.status] ?? result.status}</dd>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-slate-500">حالة التسجيل</dt>
                  <dd className="font-semibold text-navy">مسجل</dd>
                </div>
                {result.ownerDisplayName && (
                  <div className="flex items-center justify-between py-2.5">
                    <dt className="text-slate-500">المالك المسجل</dt>
                    <dd className="font-semibold text-navy">{result.ownerDisplayName}</dd>
                  </div>
                )}
              </dl>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
