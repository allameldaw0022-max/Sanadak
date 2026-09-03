"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Smartphone } from "lucide-react";
import { registerDeviceAction } from "@/app/devices/actions";
import { isValidImei, normalizeImei } from "@/lib/devices/imei-format";
import { consumeImeiHandoff } from "@/lib/devices/imei-handoff";
import { isNetworkFailure, OFFLINE_MESSAGE } from "@/lib/network";
import { LimitReachedNotice } from "@/components/devices/LimitReachedNotice";

// Fast, non-authoritative client-side format check using imei-format.ts
// ONLY (normalize/length/digits/Luhn) -- no HMAC, no secret, nothing from
// imei-hash.ts is imported here or anywhere in this Client Component.
// registerDeviceAction re-validates and computes the real HMAC hash
// server-side regardless; this is purely for instant feedback.
function clientImeiError(raw: string, label: string): string | null {
  if (!isValidImei(normalizeImei(raw))) {
    return `رقم ${label} غير صالح. تأكد من إدخال 15 رقمًا صحيحًا.`;
  }
  return null;
}

export function RegisterDeviceForm() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [imei1, setImei1] = useState("");
  const [imei2, setImei2] = useState("");

  // One-time prefill from an IMEI check's "سجّل هذا الجهاز الآن" CTA, if
  // any -- see imei-handoff.ts. Never a query param (the IMEI must not
  // appear in the URL), and consumeImeiHandoff() clears it immediately so
  // it's never reapplied on a later visit. Still just a starting value for
  // a plain, editable text input -- registerDeviceAction re-validates and
  // re-hashes everything server-side regardless of where it came from.
  useEffect(() => {
    const handoff = consumeImeiHandoff();
    if (!handoff) return;
    // Deferred a tick rather than calling setState synchronously in the
    // effect body -- same pattern as the login page's resend-cooldown
    // timer, avoids react-hooks/set-state-in-effect.
    const id = setTimeout(() => setImei1(handoff), 0);
    return () => clearTimeout(id);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [limitNotice, setLimitNotice] = useState<{ message: string; ctaLabel: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLimitNotice(null);

    if (!brand.trim()) {
      setError("الرجاء إدخال ماركة الجهاز.");
      return;
    }
    if (!model.trim()) {
      setError("الرجاء إدخال موديل الجهاز.");
      return;
    }
    const imei1Error = clientImeiError(imei1, "IMEI1");
    if (imei1Error) {
      setError(imei1Error);
      return;
    }
    if (imei2.trim()) {
      const imei2Error = clientImeiError(imei2, "IMEI2");
      if (imei2Error) {
        setError(imei2Error);
        return;
      }
      if (normalizeImei(imei2) === normalizeImei(imei1)) {
        setError("لا يمكن أن يكون IMEI2 مطابقًا لـ IMEI1.");
        return;
      }
    }

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      setError(OFFLINE_MESSAGE);
      return;
    }

    startTransition(async () => {
      try {
        // owner_id and current_status are never sent from here -- there is
        // no field for either in this form or in registerDeviceAction's
        // input type. The server derives owner_id from the session and
        // always starts the device at ACTIVE.
        const result = await registerDeviceAction({
          brand,
          model,
          color: color.trim() || null,
          serialNumber: serialNumber.trim() || null,
          imei1,
          imei2: imei2.trim() || null,
        });

        if (!result.ok) {
          if (result.limitReached && result.ctaLabel) {
            setLimitNotice({ message: result.error, ctaLabel: result.ctaLabel });
          } else {
            setError(result.error);
          }
          return;
        }

        router.push(`/devices/${result.deviceId}`);
        router.refresh();
      } catch (err) {
        // The Server Action call itself failed to reach the server -- a
        // dropped connection, not a rejection registerDeviceAction returned
        // on purpose. Never let this look like the request went through.
        setError(isNetworkFailure(err) ? OFFLINE_MESSAGE : "تعذر تسجيل الجهاز، حاول مرة أخرى.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
          <Smartphone className="h-5 w-5" />
        </span>
        <h1 className="text-lg font-extrabold text-navy">تسجيل جهاز جديد</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">الماركة</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="مثال: Samsung"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">الموديل</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="مثال: Galaxy A54"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">اللون (اختياري)</label>
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="مثال: أسود"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">الرقم التسلسلي (اختياري)</label>
          <input
            type="text"
            dir="ltr"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">IMEI1</label>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={imei1}
            onChange={(e) => setImei1(e.target.value)}
            placeholder="15 رقمًا"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">IMEI2 (اختياري)</label>
          <input
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={imei2}
            onChange={(e) => setImei2(e.target.value)}
            placeholder="للأجهزة ثنائية الشريحة"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {limitNotice && <LimitReachedNotice message={limitNotice.message} ctaLabel={limitNotice.ctaLabel} />}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "جارٍ التسجيل..." : "تسجيل الجهاز"}
      </button>
    </form>
  );
}
