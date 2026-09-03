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

// The six core services, in the exact order a visitor moves through them:
// check first, then register/document/certify an owned device, then report
// or verify one. "أجهزتي" (my devices) stays reachable from the header/
// bottom nav rather than competing here -- this grid is the product's map
// of what Sanadak *does*, not a personal dashboard shortcut.
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

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <Container className="py-8 sm:py-12">
        <h2 className="mb-4 text-center text-base font-extrabold text-navy sm:text-lg">
          كل ما تحتاجه لحماية جهازك
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {actions.map((action) => (
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
    </>
  );
}
