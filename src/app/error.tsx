"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Container } from "@/components/ui/Container";

// Root error boundary: catches any unhandled error thrown while rendering a
// page under the root layout (Header/Footer/MobileNav keep rendering around
// it, same as not-found.tsx). Deliberately shows no error detail/digest/
// stack to the user -- just a friendly, on-brand fallback with a way
// forward. A plain error.tsx is enough here; nothing in this app throws
// from inside the root layout itself, so global-error.tsx would only add
// an unused second boundary.
export default function ErrorBoundary({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertTriangle className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-extrabold text-navy">حدث خطأ ما</h1>
      <p className="max-w-sm text-sm text-slate-500">
        عذرًا، حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
        >
          <RefreshCw className="h-4 w-4" />
          إعادة المحاولة
        </button>
        <Link
          href="/"
          className="flex h-11 items-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-navy transition-colors hover:bg-slate-50"
        >
          العودة للرئيسية
        </Link>
      </div>
    </Container>
  );
}
