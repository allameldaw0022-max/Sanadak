import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة | سندك",
  description: "إجابات مختصرة على أكثر الأسئلة شيوعًا حول فحص أجهزة الجوال وتوثيق ملكيتها عبر سندك.",
};

const faqs: { question: string; answer: string }[] = [
  {
    question: "ما هو سندك؟",
    answer:
      "سندك منصة سودانية تتيح لك فحص أجهزة الجوال عبر رقم IMEI، وتسجيل جهازك، وإصدار شهادة ملكية يمكن لأي شخص التحقق منها لاحقًا.",
  },
  {
    question: "هل سندك جهة حكومية؟",
    answer: "لا. سندك منصة مستقلة، وليست جهة حكومية أو تابعة لأي جهة رسمية.",
  },
  {
    question: "ما هو رقم IMEI؟",
    answer:
      "رقم تعريف فريد لكل جهاز جوال. يمكنك الحصول عليه بطلب *#06# من جهازك، أو من علبة الجهاز أو إعداداته.",
  },
  {
    question: "كيف أفحص الجهاز قبل الشراء؟",
    answer:
      'من صفحة "فحص IMEI"، أدخل رقم IMEI للجهاز الذي تنوي شراءه لتظهر لك حالته الحالية قبل إتمام الشراء.',
  },
  {
    question: "هل فحص IMEI مجاني؟",
    answer: "نعم، فحص رقم IMEI الفردي متاح مجانًا لأي زائر دون الحاجة لحساب.",
  },
  {
    question: "هل أحتاج حسابًا لفحص الجهاز؟",
    answer:
      "لا. الفحص متاح دون تسجيل دخول. تحتاج حسابًا فقط لتسجيل جهازك، أو تقديم مطالبة ملكية أو بلاغ، أو إصدار شهادة.",
  },
  {
    question: "كيف أسجل جهازي؟",
    answer: 'أنشئ حسابًا، ثم من صفحة "أجهزتي" أضف جهازك ببياناته (الماركة، الموديل، رقم IMEI، وغيرها).',
  },
  {
    question: "ما هي شهادة الملكية؟",
    answer:
      "مستند رقمي يوثّق تسجيل الجهاز باسم صاحبه على سندك، ويحمل رمز QR يمكن لأي شخص مسحه للتحقق من صحته.",
  },
  {
    question: "ماذا تثبت شهادة الملكية؟",
    answer: "تثبت أن الجهاز (الماركة والموديل) مسجّل على سندك، وتاريخ إصدار الشهادة، وأن حالة الجهاز سليمة وقت التحقق.",
  },
  {
    question: "هل شهادة الملكية تعني ضمانًا قانونيًا أو ضمانًا مطلقًا؟",
    answer:
      "لا. الشهادة توثيق داخلي على منصة سندك بناءً على البيانات المسجّلة لدينا، وليست وثيقة رسمية أو ضمانًا قانونيًا مطلقًا لملكية الجهاز.",
  },
  {
    question: "كيف أتحقق من شهادة الملكية؟",
    answer: 'امسح رمز QR الموجود على الشهادة من صفحة "التحقق من شهادة"، أو أدخل معرّف الشهادة يدويًا، لعرض حالتها الحالية.',
  },
  {
    question: "ماذا أفعل إذا فقدت جهازي أو تعرض للسرقة؟",
    answer:
      'سجّل الدخول إلى حسابك، وافتح الجهاز من صفحة "أجهزتي"، ثم قدّم بلاغ فقدان أو سرقة ليظهر ذلك لأي شخص يفحص رقمه لاحقًا.',
  },
  {
    question: "ماذا يحدث إذا بعت جهازي؟",
    answer: "يمكن للمشتري تسجيل الجهاز أو تقديم مطالبة ملكية باسمه بعد الشراء عبر سندك، حسب آلية المطالبات المتاحة على المنصة.",
  },
  {
    question: "هل يتم نشر رقم IMEI الخاص بي؟",
    answer:
      "لا. لا يظهر رقم IMEI الكامل لأي طرف آخر. نتيجة فحص IMEI العلنية تُظهر فقط حالة الجهاز، وشهادة الملكية العلنية تُظهر فقط الماركة والموديل وتاريخ الإصدار والصلاحية، دون كشف رقم IMEI أو هوية المالك.",
  },
  {
    question: "ماذا أفعل إذا لم تظهر نتيجة للجهاز؟",
    answer: "هذا يعني غالبًا أن الجهاز غير مسجّل بعد على سندك، وليس بالضرورة مؤشرًا على وجود مشكلة فيه.",
  },
  {
    question: "كيف أتواصل مع سندك؟",
    answer: 'عبر البريد الإلكتروني الموضح أسفل الموقع في قسم "تواصل معنا".',
  },
];

export default function FaqPage() {
  return (
    <Container className="py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
            <HelpCircle className="h-4.5 w-4.5" />
          </span>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">الأسئلة الشائعة</h1>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          إجابات مختصرة على أكثر الأسئلة شيوعًا حول فحص الأجهزة وتوثيق ملكيتها عبر سندك. لمزيد من
          التفاصيل يمكنك مراجعة{" "}
          <Link href="/privacy" className="font-semibold text-primary hover:text-primary-dark">
            سياسة الخصوصية
          </Link>{" "}
          و
          <Link href="/terms" className="font-semibold text-primary hover:text-primary-dark">
            شروط الاستخدام
          </Link>
          .
        </p>

        <div className="mt-8 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-4 sm:p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-navy marker:content-none">
                {faq.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Container>
  );
}
