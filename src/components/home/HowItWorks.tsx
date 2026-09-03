import Link from "next/link";
import { ShieldCheck, PlusCircle, BadgeCheck, QrCode } from "lucide-react";
import { Container } from "@/components/ui/Container";

// Every href/icon here matches an existing service on the homepage's own
// services grid (same routes, same icons) -- this section is a summary of
// that same flow, not a new one. No new route, no data fetching, no logic.
const steps = [
  {
    href: "/devices/check",
    icon: ShieldCheck,
    title: "افحص",
    desc: "تحقق من حالة أي جهاز برقم IMEI خلال ثوانٍ",
  },
  {
    href: "/devices/new",
    icon: PlusCircle,
    title: "سجّل ووثّق",
    desc: "سجّل جهازك أو قدّم مطالبة ملكية له",
  },
  {
    href: "/devices/certificates",
    icon: BadgeCheck,
    title: "احصل على شهادة",
    desc: "احصل على شهادة ملكية قابلة للتحقق",
  },
  {
    href: "/verify",
    icon: QrCode,
    title: "تحقق",
    desc: "يمكن لأي شخص التأكد من الشهادة عبر QR",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="border-t border-slate-200 bg-white">
      <Container className="py-10 sm:py-14">
        <div className="text-center">
          <h2 id="how-it-works-heading" className="text-xl font-extrabold text-navy sm:text-2xl">
            كيف يعمل سندك؟
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 sm:text-base">أربع خطوات بسيطة من الفحص إلى التوثيق</p>
        </div>

        <ol className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="flex h-full flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-light text-primary-dark">
                  <step.icon className="h-6 w-6" />
                  <span
                    aria-hidden="true"
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white"
                  >
                    {i + 1}
                  </span>
                </span>
                <p className="text-sm font-bold text-navy">{step.title}</p>
                <p className="text-xs leading-relaxed text-slate-500">{step.desc}</p>
              </Link>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
