import Link from "next/link";
import {
  ShieldCheck,
  PlusCircle,
  BadgeCheck,
  FileSearch,
  ShieldAlert,
  QrCode,
} from "lucide-react";
import { HeroSection } from "@/components/ui/HeroSection";
import { Container } from "@/components/ui/Container";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhySanadak } from "@/components/home/WhySanadak";

// The six core services, in the exact order a visitor moves through them:
// check first, then register/document/certify an owned device, then report
// or verify one. "أجهزتي" (my devices) stays reachable from the header/
// bottom nav rather than competing here -- this grid is the product's map
// of what Sanadak *does*, not a personal dashboard shortcut.
//
// `primary` is presentation-only metadata (which two get the prominent
// treatment below) -- every href/label/desc/icon is unchanged from before.
const actions = [
  {
    href: "/devices/check",
    label: "فحص IMEI",
    desc: "تحقق من جهاز قبل الشراء",
    icon: ShieldCheck,
    primary: true,
  },
  {
    href: "/devices/new",
    label: "تسجيل جهاز",
    desc: "وثّق ملكية جهازك على سندك",
    icon: PlusCircle,
    primary: true,
  },
  {
    href: "/devices/claims",
    label: "توثيق الملكية",
    desc: "قدّم مطالبة ملكية لجهاز",
    icon: FileSearch,
  },
  {
    href: "/devices/certificates",
    label: "شهادة ملكية",
    desc: "أصدر شهادة رسمية لجهازك",
    icon: BadgeCheck,
  },
  {
    href: "/devices/reports",
    label: "الإبلاغ عن مفقود/مسروق",
    desc: "بلّغ عن جهاز فقد أو سُرق",
    icon: ShieldAlert,
  },
  {
    href: "/verify",
    label: "التحقق من شهادة",
    desc: "تحقق من شهادة عبر QR",
    icon: QrCode,
  },
];

const primaryActions = actions.filter((a) => a.primary);
const secondaryActions = actions.filter((a) => !a.primary);

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <HowItWorks />

      <Container className="py-8 sm:py-12">
        <h2 className="mb-4 text-center text-base font-extrabold text-navy sm:text-lg">
          كل ما تحتاجه لحماية جهازك
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {primaryActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary-light/30 p-5 text-right transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white">
                <action.icon className="h-7 w-7" />
              </span>
              <div>
                <p className="text-base font-extrabold text-navy">{action.label}</p>
                <p className="mt-0.5 text-sm text-slate-600">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {secondaryActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
                <action.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-navy">{action.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>

      <WhySanadak />
    </>
  );
}
