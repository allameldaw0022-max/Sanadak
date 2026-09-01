"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewSubscriptionRequestAction } from "@/app/admin/subscriptions/actions";

export function SubscriptionRequestReviewButtons({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await reviewSubscriptionRequestAction(requestId, "approved");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function reject() {
    if (!reason.trim()) {
      setError("اكتب سبب الرفض.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await reviewSubscriptionRequestAction(requestId, "rejected", reason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (showReject) {
    return (
      <div className="flex flex-col gap-2">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="سبب الرفض"
          className="h-9 w-48 rounded-lg border border-slate-200 px-2 text-xs focus:border-primary focus:outline-none"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={reject}
            disabled={pending}
            className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
          >
            تأكيد الرفض
          </button>
          <button
            type="button"
            onClick={() => setShowReject(false)}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
          >
            إلغاء
          </button>
        </div>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary-dark hover:bg-primary/20 disabled:opacity-60"
        >
          موافقة
        </button>
        <button
          type="button"
          onClick={() => setShowReject(true)}
          disabled={pending}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200 disabled:opacity-60"
        >
          رفض
        </button>
      </div>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
