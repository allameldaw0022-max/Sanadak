import Link from "next/link";
import { Lock } from "lucide-react";

// Shown instead of the plain red error text specifically when
// registerDeviceAction() reports limitReached -- a single, clear message
// plus one CTA button to /dealer/subscription (the existing page from the
// dealer subscriptions feature), never a second registration flow.
export function LimitReachedNotice({ message, ctaLabel }: { message: string; ctaLabel: string }) {
  return (
    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2.5">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-sm font-medium text-amber-800">{message}</p>
      </div>
      <Link
        href="/dealer/subscription"
        className="mt-3 flex h-10 w-full items-center justify-center rounded-lg bg-navy text-sm font-bold text-white transition-colors hover:bg-slate-800"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
