"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { UploadCloud, FileText, X, AlertCircle, Landmark } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitPaymentRequestAction } from "@/app/developer/subscription/actions";
import type { PaymentSettings } from "@/lib/supabase/queries";
import { formatUsd, formatSdg, formatExchangeRate, planPickLabels } from "@/lib/subscription";
import { cn } from "@/lib/utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_PROOF_SIZE = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function PaymentRequestForm({
  plan,
  developerId,
  settings,
  onCancel,
}: {
  plan: "basic" | "pro";
  developerId: string;
  settings: PaymentSettings;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [payerName, setPayerName] = useState("");
  const [transactionReference, setTransactionReference] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const priceUsd = plan === "basic" ? settings.basicPriceUsd : settings.proPriceUsd;
  const priceSdg = Math.round(priceUsd * settings.usdToSdgRate * 100) / 100;

  function handleFileSelect(selected: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("الصيغ المسموحة: JPG، PNG، WEBP، PDF فقط.");
      return;
    }
    if (selected.size > MAX_PROOF_SIZE) {
      setError("حجم الملف يجب ألا يتجاوز 5 ميجابايت.");
      return;
    }
    setFile(selected);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("يرجى إرفاق صورة إشعار التحويل.");
      return;
    }
    if (!payerName.trim() || !transactionReference.trim() || !transferDate) {
      setError("يرجى تعبئة كل الحقول المطلوبة.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const ext = EXT_BY_TYPE[file.type] ?? "bin";
      const path = `${developerId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        setError("تعذر رفع إشعار التحويل، حاول مرة أخرى.");
        return;
      }

      const formData = new FormData();
      formData.set("plan", plan);
      formData.set("payerName", payerName.trim());
      formData.set("transactionReference", transactionReference.trim());
      formData.set("transferDate", transferDate);
      formData.set("proofPath", path);
      formData.set("note", note.trim());

      try {
        await submitPaymentRequestAction(formData);
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذر إرسال طلب الدفع، حاول مرة أخرى.");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-base font-bold text-navy">تم إرسال طلب الدفع بنجاح</p>
        <p className="mt-2 text-sm text-slate-500">
          🟠 بانتظار مراجعة الدفع — سيراجع فريق سندك طلبك ويفعّل اشتراكك بعد التأكد من التحويل.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2">
        <Landmark className="h-5 w-5 text-primary" />
        <h3 className="text-base font-bold text-navy">
          الدفع عبر التحويل البنكي — {planPickLabels[plan]}
        </h3>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-slate-500">البنك</dt>
          <dd className="font-semibold text-navy">{settings.bankName || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">اسم صاحب الحساب</dt>
          <dd className="font-semibold text-navy">{settings.accountHolderName || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">رقم الحساب</dt>
          <dd className="font-semibold text-navy">{settings.accountNumber || "—"}</dd>
        </div>
        {settings.iban && (
          <div>
            <dt className="text-xs text-slate-500">IBAN</dt>
            <dd className="font-semibold text-navy">{settings.iban}</dd>
          </div>
        )}
        {settings.phone && (
          <div>
            <dt className="text-xs text-slate-500">رقم الهاتف</dt>
            <dd className="font-semibold text-navy">{settings.phone}</dd>
          </div>
        )}
        {settings.paymentMethodName && (
          <div>
            <dt className="text-xs text-slate-500">وسيلة الدفع</dt>
            <dd className="font-semibold text-navy">{settings.paymentMethodName}</dd>
          </div>
        )}
      </dl>

      {settings.paymentInstructions && (
        <p className="mt-3 text-xs leading-relaxed text-slate-500">{settings.paymentInstructions}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary-light/40 p-4">
        <div>
          <p className="text-xs text-slate-500">المبلغ المطلوب</p>
          <p className="text-lg font-extrabold text-navy">
            {formatSdg(priceSdg)} <span className="text-sm font-semibold text-slate-500">({formatUsd(priceUsd)})</span>
          </p>
        </div>
        <span className="mr-auto rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary-dark">
          {formatExchangeRate(settings.usdToSdgRate)}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy">اسم المُحوِّل</label>
            <input
              type="text"
              required
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy">رقم العملية / المرجع</label>
            <input
              type="text"
              required
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy">تاريخ التحويل</label>
            <input
              type="date"
              required
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">ملاحظة (اختياري)</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-navy">إرفاق إشعار التحويل</label>
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFileSelect(selected);
              e.target.value = "";
            }}
          />
          {file ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-primary/40 bg-primary-light/40 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-5 w-5 shrink-0 text-primary-dark" />
                <span className="truncate text-xs font-semibold text-navy">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                إزالة
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center transition-colors hover:border-primary/40"
            >
              <UploadCloud className="h-7 w-7 text-slate-400" />
              <span className="text-xs text-slate-500">JPG، PNG، WEBP أو PDF — حتى 5 ميجابايت</span>
              <span className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                اختر ملفًا
              </span>
            </button>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={pending}
            className={cn(
              "h-12 flex-[2] rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            )}
          >
            {pending ? "جارٍ الإرسال..." : "إرسال طلب الدفع"}
          </button>
        </div>
      </form>
    </div>
  );
}
