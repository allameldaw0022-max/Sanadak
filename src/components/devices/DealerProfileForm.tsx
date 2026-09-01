"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertCircle, CheckCircle2, Store } from "lucide-react";
import { updateDealerProfileAction, uploadDealerLogoAction } from "@/app/dealer/subscription/actions";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_SIZE = 2 * 1024 * 1024;

export function DealerProfileForm({
  initial,
}: {
  initial: {
    businessName: string | null;
    contactName: string | null;
    phone: string | null;
    address: string | null;
    logoSignedUrl: string | null;
  };
}) {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [businessName, setBusinessName] = useState(initial.businessName ?? "");
  const [contactName, setContactName] = useState(initial.contactName ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();
  const [logoPending, startLogoTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateDealerProfileAction({ businessName, contactName, phone, address });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      router.refresh();
    });
  }

  function handleLogoFile(file: File) {
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("الشعار يجب أن يكون PNG أو JPG أو WebP.");
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      setError("حجم الشعار يجب ألا يتجاوز 2 ميجابايت.");
      return;
    }
    setError(null);
    startLogoTransition(async () => {
      const result = await uploadDealerLogoAction(file);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {initial.logoSignedUrl ? (
            <Image
              src={initial.logoSignedUrl}
              alt="شعار النشاط التجاري"
              width={64}
              height={64}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <Store className="h-7 w-7 text-slate-300" />
          )}
        </div>
        <div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLogoFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            disabled={logoPending}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-navy transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            {logoPending ? "جارٍ الرفع..." : "تغيير الشعار"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">اسم النشاط التجاري</span>
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">اسم المسؤول</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">رقم الهاتف</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-500">العنوان</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary focus:outline-none"
          />
        </label>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-primary-dark">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          تم حفظ البيانات.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className="h-11 rounded-xl bg-navy px-6 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "جارٍ الحفظ..." : "حفظ البيانات"}
      </button>
    </div>
  );
}
