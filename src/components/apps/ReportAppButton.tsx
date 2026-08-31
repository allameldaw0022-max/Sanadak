"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Flag, AlertCircle } from "lucide-react";
import { submitReportAction } from "@/app/apps/[slug]/actions";
import { reportReasons } from "@/data/reportReasons";

export function ReportAppButton({ appId }: { appId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason) {
      setError("يرجى اختيار سبب البلاغ.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set("appId", appId);
    formData.set("reason", reason);
    formData.set("details", details);

    startTransition(async () => {
      await submitReportAction(formData);
      setDone(true);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-red-600"
      >
        <Flag className="h-3.5 w-3.5" />
        الإبلاغ عن هذا التطبيق
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-4 text-center">
                <p className="text-sm font-bold text-navy">تم إرسال البلاغ</p>
                <p className="mt-1 text-xs text-slate-500">
                  شكرًا لك، سيراجع فريق سندك هذا البلاغ.
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-4 h-10 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold text-navy">الإبلاغ عن التطبيق</h3>
                <p className="mt-1 text-xs text-slate-500">اختر السبب الأنسب لبلاغك.</p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <div className="space-y-1.5">
                    {reportReasons.map((r) => (
                      <label
                        key={r.value}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary-light"
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={(e) => setReason(e.target.value)}
                          className="accent-primary"
                        />
                        {r.label}
                      </label>
                    ))}
                  </div>

                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    placeholder="تفاصيل إضافية (اختياري)"
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />

                  {error && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {pending ? "جارٍ الإرسال..." : "إرسال البلاغ"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
