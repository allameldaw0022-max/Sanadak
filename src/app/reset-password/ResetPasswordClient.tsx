"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { createClient } from "@/lib/supabase/client";
import { describeUpdatePasswordError } from "@/lib/authErrors";

// No /auth/callback route exists anywhere in this app (the existing signup
// email-confirmation flow relies on the same mechanism) -- createClient()'s
// detectSessionInUrl:true (a createBrowserClient default from @supabase/ssr)
// already exchanges the recovery link's code for a session automatically
// on load. This page just waits for that to land, following Supabase's own
// documented pattern of listening for the PASSWORD_RECOVERY auth event.
type PageStatus = "checking" | "ready" | "invalid" | "success";

export function ResetPasswordClient() {
  const router = useRouter();
  const [status, setStatus] = useState<PageStatus>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    // A link that's already expired or was reused redirects back here with
    // an explicit error instead of a usable code -- catch that immediately
    // rather than waiting out the timeout below. Deferred via setTimeout
    // (not called directly in the effect body) per the lint rule against
    // synchronous setState-in-effect.
    if (params.get("error") || hashParams.get("error")) {
      const t = setTimeout(() => setStatus("invalid"), 0);
      return () => clearTimeout(t);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    // Covers the case where detectSessionInUrl already finished exchanging
    // the code before this listener was attached.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus((s) => (s === "checking" ? "ready" : s));
    });

    const timeout = setTimeout(() => {
      setStatus((s) => (s === "checking" ? "invalid" : s));
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (password.length < 6) {
      setFormError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setFormError(describeUpdatePasswordError(error));
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/login"), 2500);
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
          <h1 className="mt-4 text-xl font-extrabold text-navy">تعيين كلمة مرور جديدة</h1>
        </div>

        {status === "checking" && <p className="py-8 text-center text-sm text-slate-500">جارٍ التحقق من الرابط...</p>}

        {status === "invalid" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm font-semibold text-navy">الرابط منتهي الصلاحية أو غير صالح</p>
            <p className="text-xs text-slate-500">اطلب رابط استعادة جديدًا للمتابعة.</p>
            <Link
              href="/forgot-password"
              className="mt-2 flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
            >
              طلب رابط جديد
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-navy">تم تغيير كلمة المرور بنجاح</p>
            <p className="text-xs text-slate-500">جارٍ نقلك لتسجيل الدخول...</p>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-navy">
                كلمة المرور الجديدة
              </label>
              <PasswordInput
                id="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-navy">
                تأكيد كلمة المرور
              </label>
              <PasswordInput
                id="confirmPassword"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
              />
            </div>

            {formError && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" />
              {submitting ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </Container>
  );
}
