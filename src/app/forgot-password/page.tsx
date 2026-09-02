"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, AlertCircle, Send } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/client";
import { describeResetPasswordError } from "@/lib/authErrors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    // Supabase never reports whether the address is registered -- a
    // genuine send failure (network/rate-limit) is the only case that
    // reaches this branch; an unregistered email still resolves with no
    // error, exactly like the "sent" state below, on purpose.
    if (resetError) {
      setError(describeResetPasswordError(resetError));
      return;
    }
    setSent(true);
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <Image
            src="/logo-mark.png"
            alt="سندك"
            width={48}
            height={48}
            className="mx-auto h-12 w-12 rounded-xl object-cover"
          />
          <h1 className="mt-4 text-xl font-extrabold text-navy">استعادة كلمة المرور</h1>
          <p className="mt-1 text-sm text-slate-500">أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور</p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-navy">تم إرسال الرابط</p>
            <p className="text-xs text-slate-500">
              إذا كان بريدك مسجّلًا لدينا، ستصلك رسالة تحتوي على رابط إعادة تعيين كلمة المرور خلال دقائق.
            </p>
            <Link href="/login" className="mt-2 text-xs font-semibold text-primary hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-navy">
                البريد الإلكتروني
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@sanadak.sd"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
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
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {loading ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
            </button>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-navy"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              العودة لتسجيل الدخول
            </Link>
          </form>
        )}
      </div>
    </Container>
  );
}
