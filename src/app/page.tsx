import Link from "next/link";
import {
  ShieldCheck,
  Smartphone,
  PlusCircle,
  BadgeCheck,
  FileSearch,
  ShieldAlert,
  QrCode,
  ClipboardCheck,
} from "lucide-react";
import { HeroSection } from "@/components/ui/HeroSection";
import { Container } from "@/components/ui/Container";

const actions = [
  {
    href: "/devices/check",
    label: "فحص IMEI",
    desc: "تحقق من جهاز قبل الشراء",
    icon: ShieldCheck,
  },
  {
    href: "/devices/new",
    label: "تسجيل جهاز",
    desc: "وثّق ملكية جهازك على سندك",
    icon: PlusCircle,
  },
  {
    href: "/devices",
    label: "أجهزتي",
    desc: "تابع حالة أجهزتك المسجلة",
    icon: Smartphone,
  },
  {
    href: "/verify",
    label: "التحقق من شهادة",
    desc: "تأكد من صحة شهادة جهاز",
    icon: BadgeCheck,
  },
];

const features = [
  { icon: ClipboardCheck, text: "تسجيل الأجهزة وربطها برقم IMEI" },
  { icon: FileSearch, text: "توثيق الملكية عبر مطالبات قابلة للمراجعة" },
  { icon: ShieldAlert, text: "الإبلاغ عن الأجهزة المفقودة أو المسروقة" },
  { icon: BadgeCheck, text: "شهادات ملكية رسمية لكل جهاز" },
  { icon: QrCode, text: "تحقق فوري عبر رمز QR بدون تسجيل دخول" },
];

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <Container className="py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:flex-row sm:items-center sm:gap-3 sm:text-right"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                <action.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{action.label}</p>
                <p className="hidden text-xs text-slate-500 sm:block">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>

      <section className="border-t border-slate-200 bg-slate-50/60">
        <Container className="py-10 sm:py-14">
          <h2 className="text-center text-lg font-extrabold text-navy sm:text-xl">
            كل ما تحتاجه لحماية جهازك
          </h2>
          <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary-dark">
                  <feature.icon className="h-4.5 w-4.5" />
                </span>
                <p className="text-sm font-semibold text-navy">{feature.text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
