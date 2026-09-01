import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogOut, LayoutDashboard, ShieldCheck, Smartphone } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { getCurrentUser } from "@/lib/supabase/queries";
import { signOutAction } from "@/app/auth/actions";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/devices/check", label: "فحص IMEI" },
  { href: "/verify", label: "التحقق من شهادة" },
];

function GuestActions() {
  return (
    <Link
      href="/login"
      className="flex h-10 items-center rounded-xl bg-navy px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
    >
      تسجيل الدخول
    </Link>
  );
}

// The logo and nav links are static and should never wait on anything.
// Only this segment depends on who's signed in, so it's the only part
// wrapped in Suspense — the rest of the header (and the page behind it)
// can stream and become interactive immediately instead of the whole
// header blocking on an auth round-trip.
async function HeaderAuthActions() {
  const user = await getCurrentUser();

  if (!user) return <GuestActions />;

  return (
    <>
      <Link
        href="/devices"
        className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy transition-colors hover:bg-slate-50 sm:flex"
      >
        <Smartphone className="h-4 w-4" />
        أجهزتي
      </Link>
      {user.role === "developer" && (
        <Link
          href="/developer/dashboard"
          className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy transition-colors hover:bg-slate-50 sm:flex"
        >
          <LayoutDashboard className="h-4 w-4" />
          لوحة التحكم
        </Link>
      )}
      {user.role === "admin" && (
        <Link
          href="/admin"
          className="hidden h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-navy transition-colors hover:bg-slate-50 sm:flex"
        >
          <ShieldCheck className="h-4 w-4" />
          الإدارة
        </Link>
      )}
      <Link
        href="/account"
        className="hidden max-w-[10rem] truncate text-sm font-semibold text-slate-600 transition-colors hover:text-primary md:inline"
      >
        {user.fullName || user.email}
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          aria-label="تسجيل الخروج"
          className="flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </form>
    </>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo-mark.png"
            alt="سندك"
            width={36}
            height={36}
            priority
            className="h-9 w-9 shrink-0 rounded-xl object-cover"
          />
          <span className="text-lg font-extrabold text-navy">سندك</span>
        </Link>

        <nav className="hidden shrink-0 items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <Suspense fallback={<GuestActions />}>
            <HeaderAuthActions />
          </Suspense>
        </div>
      </Container>
    </header>
  );
}
