"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, MessageSquareWarning } from "lucide-react";
import { submitDeviceReportAction } from "@/app/devices/reports/actions";

export function DeviceReportForm({ deviceId }: { deviceId: string }) {
  const router = useRouter();
  const [reportType, setReportType] = useState<"LOST" | "STOLEN">("LOST");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitDeviceReportAction({ deviceId, reportType, details: details.trim() || null });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/devices/reports/${result.reportId}`);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
      >
        <MessageSquareWarning className="h-4 w-4" />
        الإبلاغ عن الجهاز كمفقود أو مسروق
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="mb-3 text-sm font-bold text-red-700">الإبلاغ عن الجهاز</p>

      <div className="mb-3 flex gap-2">
        {(["LOST", "STOLEN"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setReportType(t)}
            className={`h-10 flex-1 rounded-xl text-sm font-semibold transition-colors ${
              reportType === t ? "bg-red-600 text-white" : "border border-red-200 bg-white text-red-600"
            }`}
          >
            {t === "LOST" ? "مفقود" : "مسروق"}
          </button>
        ))}
      </div>

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
        placeholder="تفاصيل إضافية (اختياري)"
        className="w-full resize-none rounded-xl border border-red-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-red-200"
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-10 flex-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-10 flex-1 rounded-xl bg-red-600 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "جارٍ الإرسال..." : "إرسال البلاغ"}
        </button>
      </div>
    </form>
  );
}
