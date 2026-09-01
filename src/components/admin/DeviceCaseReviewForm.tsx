"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { reviewOwnershipClaimAction, reviewDeviceReportAction } from "@/app/admin/devices/actions";
import type { Database } from "@/lib/supabase/database.types";

type ClaimStatus = Database["public"]["Enums"]["ownership_claim_status"];
type ReportStatus = Database["public"]["Enums"]["device_report_status"];

const CLAIM_OPTIONS: { value: ClaimStatus; label: string }[] = [
  { value: "UNDER_REVIEW", label: "قيد المراجعة" },
  { value: "MORE_INFORMATION_REQUIRED", label: "طلب معلومات إضافية" },
  { value: "APPROVED", label: "الموافقة (نقل الملكية)" },
  { value: "REJECTED", label: "رفض" },
];

const REPORT_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: "UNDER_REVIEW", label: "قيد المراجعة" },
  { value: "APPROVED", label: "الموافقة (تحديث حالة الجهاز)" },
  { value: "REJECTED", label: "رفض" },
];

type Props = { kind: "claim"; id: string } | { kind: "report"; id: string };

// Every actual authorization check happens server-side inside
// review_ownership_claim/review_device_report (admin/service_role-gated) --
// this form only decides which RPC to call and shows the result. A
// non-admin can never reach this component at all (the admin layout itself
// redirects anyone whose role isn't 'admin').
export function DeviceCaseReviewForm(props: Props) {
  const router = useRouter();
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>(CLAIM_OPTIONS[0].value);
  const [reportStatus, setReportStatus] = useState<ReportStatus>(REPORT_OPTIONS[0].value);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const options = props.kind === "claim" ? CLAIM_OPTIONS : REPORT_OPTIONS;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        props.kind === "claim"
          ? await reviewOwnershipClaimAction(props.id, claimStatus, note.trim() || null)
          : await reviewDeviceReportAction(props.id, reportStatus, note.trim() || null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-bold text-navy">قرار المراجعة</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={props.kind === "claim" ? claimStatus : reportStatus}
          onChange={(e) =>
            props.kind === "claim"
              ? setClaimStatus(e.target.value as ClaimStatus)
              : setReportStatus(e.target.value as ReportStatus)
          }
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-navy outline-none focus:border-primary sm:w-56"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ملاحظة (مطلوبة عند الرفض أو طلب معلومات)"
          className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-xl bg-navy px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ..." : "تنفيذ"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </form>
  );
}
