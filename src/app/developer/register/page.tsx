"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { UserPlus, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/client";

export default function DeveloperRegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: "developer" } },
    });

    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "هذا البريد الإلكتروني مسجل بالفعل."
          : "تعذر إنشاء الحساب، حاول مرة أخرى."
      );
      return;
    }

    if (!data.session) {
      setPendingConfirmation(true);
      return;
    }

    setSubmitted(true);
    router.refresh();
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
            <UserPlus className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-navy">سجل كمطور في سندك</h1>
          <p className="mt-1 text-sm text-slate-500">
            انضم إلى منصتنا وانشر تطبيقاتك ليصلها آلاف المستخدمين
          </p>
        </div>

        {pendingConfirmation ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-navy">تم إنشاء حساب المطور بنجاح</p>
            <p className="text-xs text-slate-500">
              تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجّل الدخول للوصول للوحة التحكم.
            </p>
            <Link
              href="/login"
              className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
            >
              تسجيل الدخول
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        ) : submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-sm font-semibold text-navy">تم إنشاء حسابك بنجاح</p>
            <Link
              href="/developer/dashboard"
              className="mt-3 flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-dark"
            >
              الذهاب للوحة التحكم
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullname" className="mb-1.5 block text-sm font-semibold text-navy">
                الاسم الكامل / اسم الشركة
              </label>
              <input
                id="fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اسمك أو اسم شركتك"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="dev-email" className="mb-1.5 block text-sm font-semibold text-navy">
                البريد الإلكتروني
              </label>
              <input
                id="dev-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label htmlFor="dev-password" className="mb-1.5 block text-sm font-semibold text-navy">
                كلمة المرور
              </label>
              <input
                id="dev-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
              <UserPlus className="h-4 w-4" />
              {loading ? "جارٍ الإنشاء..." : "إنشاء حساب مطور"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="font-semibold text-primary hover:text-primary-dark">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </Container>
  );
}
