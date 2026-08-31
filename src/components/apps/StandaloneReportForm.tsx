"use client";

import { useState, useTransition, type FormEvent } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { submitReportAction } from "@/app/apps/[slug]/actions";
import { reportReasons } from "@/data/reportReasons";

export function StandaloneReportForm({ apps }: { apps: { id: string; name: string }[] }) {
  const [appId, setAppId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!appId) {
      setError("يرجى اختيار التطبيق المراد الإبلاغ عنه.");
      return;
    }
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

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white py-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <p className="text-sm font-bold text-navy">تم إرسال بلاغك بنجاح</p>
        <p className="text-xs text-slate-500">سيراجع فريق سندك هذا البلاغ في أقرب وقت.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy">التطبيق</label>
        <select
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        >
          <option value="">اختر التطبيق...</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy">سبب البلاغ</label>
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
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy">تفاصيل إضافية (اختياري)</label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={4}
          placeholder="اكتب أي تفاصيل تساعدنا على فهم البلاغ"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "جارٍ الإرسال..." : "إرسال البلاغ"}
      </button>
    </form>
  );
}
