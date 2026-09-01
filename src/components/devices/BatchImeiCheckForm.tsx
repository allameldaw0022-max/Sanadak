"use client";

import { useState, useTransition, type FormEvent } from "react";
import { AlertCircle, ListChecks } from "lucide-react";
import { batchCheckImeiAction, type BatchCheckResultItem } from "@/app/devices/batch-check/actions";
import { maskImei, normalizeImei } from "@/lib/devices/imei-format";

const STATUS_LABEL_CLASS: Record<string, string> = {
  ACTIVE: "text-primary-dark",
  UNDER_REVIEW: "text-amber-700",
  LOST: "text-orange-700",
  STOLEN: "text-red-600",
  RECOVERED: "text-sky-700",
};

function describeResult(result: BatchCheckResultItem["result"]): { message: string; className: string } {
  if ("error" in result) return { message: result.error, className: "text-red-600" };
  if (result.disclosed) return { message: result.message, className: STATUS_LABEL_CLASS[result.status] ?? "text-slate-600" };
  return { message: result.message, className: "text-slate-500" };
}

export function BatchImeiCheckForm() {
  const [raw, setRaw] = useState("");
  const [items, setItems] = useState<BatchCheckResultItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setItems(null);

    const imeis = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (imeis.length === 0) {
      setError("أدخل رقم IMEI واحدًا على الأقل، كل رقم في سطر.");
      return;
    }

    startTransition(async () => {
      const res = await batchCheckImeiAction(imeis);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems(res.items);
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
          <ListChecks className="h-4.5 w-4.5" />
        </span>
        <h2 className="text-sm font-bold text-navy">فحص جماعي (حتى 20 رقمًا)</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={5}
          dir="ltr"
          placeholder={"أدخل كل رقم IMEI في سطر منفصل"}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {pending ? "جارٍ الفحص..." : "فحص الأرقام"}
        </button>
      </form>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {items && (
        <div className="mt-4 space-y-2">
          {items.map((item, i) => {
            const normalized = normalizeImei(item.imeiInput);
            const label = normalized.length >= 3 ? maskImei(normalized) : item.imeiInput;
            const { message, className } = describeResult(item.result);
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="text-xs font-semibold text-slate-500" dir="ltr">
                  {label}
                </span>
                <span className={`text-xs font-bold ${className}`}>{message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
