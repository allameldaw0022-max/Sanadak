"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LogIn, UserPlus, MailCheck, AlertCircle, RefreshCw } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { createClient } from "@/lib/supabase/client";
import { describeSignInError, describeSignUpError, describeResendError } from "@/lib/authErrors";
import { sanitizeReturnPath } from "@/lib/auth/return-path";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN_SECONDS = 60;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthFailed = searchParams.get("oauth_error") === "1";
  // Only ever one of the fixed, known in-app paths in return-path.ts's
  // allowlist, or "/" -- see sanitizeReturnPath. Lets a visitor who was
  // bounced here from a protected page (e.g. the IMEI check's "هل هذا
  // جهازك؟" CTA) land back on it after signing in, instead of always on
  // "/".
  const next = sanitizeReturnPath(searchParams.get("next"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "check-email" covers both a brand-new signup and a resend triggered by
  // signing up again with an existing-but-unverified email -- Supabase's
  // signUp() genuinely can't be told apart from the outside in that second
  // case (by design, see describeSignUpError), so both must render the same
  // screen. "already-verified" is the one case Supabase *does* let us
  // detect safely (data.user.identities.length === 0), matching the
  // required "شغلها موجودة ومفعّلة" generic-safe message.
  const [screen, setScreen] = useState<"form" | "check-email" | "already-verified">("form");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signin") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (signInError) {
        setError(describeSignInError(signInError));
        return;
      }
      router.push(next);
      router.refresh();
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: "user" },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      setLoading(false);
      if (signUpError) {
        setError(describeSignUpError(signUpError));
        return;
      }
      if (data.session) {
        router.push(next);
        router.refresh();
        return;
      }
      if (data.user && data.user.identities?.length === 0) {
        setScreen("already-verified");
        return;
      }
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setScreen("check-email");
    }
  }

  async function handleResend() {
    setResendNotice(null);
    setResending(true);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setResending(false);
    if (resendError) {
      setResendNotice(describeResendError(resendError));
      return;
    }
    setResendNotice("تم إرسال رسالة تفعيل جديدة.");
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }

  function backToForm() {
    setScreen("form");
    setError(null);
    setResendNotice(null);
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
          <h1 className="mt-4 text-xl font-extrabold text-navy">
            {mode === "signin" ? "تسجيل الدخول إلى سندك" : "إنشاء حساب جديد"}
          </h1>
          {screen === "form" && <p className="mt-1 text-sm text-slate-500">أدخل بياناتك للمتابعة</p>}
        </div>

        {screen === "check-email" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <MailCheck className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-navy">تم إنشاء حسابك بنجاح</p>
            <p className="text-xs leading-relaxed text-slate-500">
              أرسلنا رسالة تفعيل إلى <span dir="ltr" className="font-semibold text-navy">{email}</span>. افتح
              الرسالة واضغط على رابط التفعيل لتفعيل حسابك قبل تسجيل الدخول.
            </p>
            <p className="text-xs leading-relaxed text-slate-400">
              لم تجد الرسالة؟ تحقق من مجلد الرسائل غير المرغوب فيها (Spam / Junk).
            </p>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-navy transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={cn("h-4 w-4", resending && "animate-spin")} />
              {resendCooldown > 0
                ? `إعادة الإرسال بعد ${resendCooldown} ثانية`
                : resending
                  ? "جارٍ الإرسال..."
                  : "إعادة إرسال رسالة التفعيل"}
            </button>

            {resendNotice && <p className="text-xs font-medium text-slate-500">{resendNotice}</p>}

            <button type="button" onClick={backToForm} className="mt-1 text-xs font-semibold text-primary hover:underline">
              العودة
            </button>
          </div>
        )}

        {screen === "already-verified" && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <p className="text-sm font-semibold text-navy">تعذر إنشاء الحساب</p>
            <p className="text-xs leading-relaxed text-slate-500">
              إذا كان لديك حساب بهذا البريد الإلكتروني بالفعل، جرّب تسجيل الدخول.
            </p>
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                backToForm();
              }}
              className="mt-2 flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
            >
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </button>
          </div>
        )}

        {screen === "form" && (
          <>
            <div className="mb-6 flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
                  mode === "signin" ? "bg-white text-navy shadow-sm" : "text-slate-500"
                )}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
                  mode === "signup" ? "bg-white text-navy shadow-sm" : "text-slate-500"
                )}
              >
                إنشاء حساب
              </button>
            </div>

            {oauthFailed && (
              <p className="mb-4 flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                تعذر تسجيل الدخول عبر Google. حاول مرة أخرى أو استخدم البريد الإلكتروني.
              </p>
            )}

            <GoogleSignInButton next={next} />

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">أو</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label htmlFor="fullname" className="mb-1.5 block text-sm font-semibold text-navy">
                    الاسم الكامل
                  </label>
                  <input
                    id="fullname"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="اسمك الكامل"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-navy">
                  البريد الإلكتروني
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@sanadak.sd"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-navy">
                  كلمة المرور
                </label>
                <PasswordInput
                  id="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={setPassword}
                />
                {mode === "signin" && (
                  <Link href="/forgot-password" className="mt-1.5 inline-block text-xs font-semibold text-primary hover:underline">
                    نسيت كلمة المرور؟
                  </Link>
                )}
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {mode === "signin" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {loading ? "جارٍ التنفيذ..." : mode === "signin" ? "تسجيل الدخول" : "إنشاء الحساب"}
              </button>
            </form>
          </>
        )}
      </div>
    </Container>
  );
}
