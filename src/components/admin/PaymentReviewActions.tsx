"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { approvePaymentAction, rejectPaymentAction } from "@/app/admin/payments/actions";

export function PaymentReviewActions({ requestId }: { requestId: string }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestId", requestId);
      try {
        await approvePaymentAction(formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر قبول الدفع.");
      }
    });
  }

  function handleReject(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("يرجى كتابة سبب الرفض.");
      return;
    }
    setError(null);
    const formData = new FormData();
    formData.set("requestId", requestId);
    formData.set("adminNote", reason.trim());
    startTransition(async () => {
      try {
        await rejectPaymentAction(formData);
        setRejectOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر رفض الدفع.");
      }
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          {pending ? "جارٍ التنفيذ..." : "قبول الدفع"}
        </button>
        <button
          type="button"
          onClick={() => setRejectOpen(true)}
          disabled={pending}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" />
          رفض الدفع
        </button>
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {rejectOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setRejectOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-navy">سبب رفض الدفع</h3>
            <p className="mt-1 text-xs text-slate-500">
              مثال: &quot;الإشعار غير واضح&quot;، &quot;رقم العملية غير صحيح&quot;، &quot;المبلغ غير مطابق&quot;.
            </p>

            <form onSubmit={handleReject} className="mt-4 space-y-3">
              <textarea
                required
                autoFocus
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="اكتب سببًا واضحًا للرفض..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectOpen(false)}
                  className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                >
                  {pending ? "جارٍ الرفض..." : "تأكيد الرفض"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
