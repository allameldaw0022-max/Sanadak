"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

// A certificate id is a plain uuid (see device_certificates.id in the
// certificates_dealers migration) -- this form only ever navigates to
// /verify/[id], which itself calls the public verify_certificate RPC.
// No certificate data is read or exposed here.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function VerifyCertificateForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!UUID_RE.test(trimmed)) {
      setError("معرّف الشهادة غير صالح. تأكد من نسخه كاملًا من الشهادة أو رمز QR.");
      return;
    }
    setError(null);
    router.push(`/verify/${trimmed}`);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          dir="ltr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="أدخل معرّف الشهادة (من الشهادة أو رابط QR)"
          className="h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-center text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 sm:text-left"
        />
        <button
          type="submit"
          className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          تحقق
        </button>
      </form>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
