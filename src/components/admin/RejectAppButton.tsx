"use client";

import { useState, useTransition, type FormEvent } from "react";
import { XCircle, AlertCircle } from "lucide-react";
import { rejectAppAction } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function RejectAppButton({ appId, className }: { appId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("يرجى كتابة سبب الرفض.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set("appId", appId);
    formData.set("reason", reason.trim());

    startTransition(async () => {
      await rejectAppAction(formData);
      setOpen(false);
      setReason("");
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <XCircle className="h-4 w-4" />
        رفض
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
            <h3 className="text-base font-bold text-navy">سبب رفض التطبيق</h3>
            <p className="mt-1 text-xs text-slate-500">سيظهر هذا السبب للمطور صاحب التطبيق.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <textarea
                required
                autoFocus
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سببًا واضحًا للرفض..."
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
                  className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className={cn(
                    "h-11 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  )}
                >
                  {pending ? "جارٍ الرفض..." : "تأكيد الرفض"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
