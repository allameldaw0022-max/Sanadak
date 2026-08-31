"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { Star, AlertCircle } from "lucide-react";
import { submitReviewAction } from "@/app/apps/[slug]/actions";
import { cn } from "@/lib/utils";

export function ReviewForm({
  appId,
  slug,
  isAuthenticated,
  existingReview,
}: {
  appId: string;
  slug: string;
  isAuthenticated: boolean;
  existingReview: { rating: number; comment: string | null } | null;
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center">
        <p className="text-sm text-slate-500">
          سجّل الدخول لتتمكن من تقييم هذا التطبيق.
        </p>
        <Link
          href="/login"
          className="mt-3 inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-dark"
        >
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("يرجى اختيار تقييم بالنجوم أولًا.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set("appId", appId);
    formData.set("slug", slug);
    formData.set("rating", String(rating));
    formData.set("comment", comment);

    startTransition(async () => {
      await submitReviewAction(formData);
      setDone(true);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <p className="mb-3 text-sm font-bold text-navy">
        {existingReview ? "عدّل تقييمك" : "أضف تقييمك"}
      </p>

      <div className="flex items-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            aria-label={`${n} نجوم`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                n <= (hoverRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-slate-300"
              )}
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="اكتب رأيك في التطبيق (اختياري)"
        className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      )}

      {done && (
        <p className="mt-2 text-xs font-medium text-primary-dark">تم حفظ تقييمك، شكرًا لك.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-3 flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {pending ? "جارٍ الحفظ..." : existingReview ? "تحديث التقييم" : "إرسال التقييم"}
      </button>
    </form>
  );
}
