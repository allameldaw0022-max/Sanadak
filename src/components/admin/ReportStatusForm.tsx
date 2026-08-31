"use client";

import { useState, useTransition, type FormEvent } from "react";
import { updateReportAction } from "@/app/admin/actions";

const statusOptions = [
  { value: "open", label: "مفتوح" },
  { value: "reviewing", label: "قيد المراجعة" },
  { value: "resolved", label: "تم الحل" },
  { value: "dismissed", label: "مرفوض" },
];

export function ReportStatusForm({
  reportId,
  status,
  adminNote,
}: {
  reportId: string;
  status: string;
  adminNote: string | null;
}) {
  const [value, setValue] = useState(status);
  const [note, setNote] = useState(adminNote ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    formData.set("reportId", reportId);
    formData.set("status", value);
    formData.set("adminNote", note);
    startTransition(async () => {
      await updateReportAction(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-navy outline-none focus:border-primary"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="ملاحظة إدارية (اختياري)"
        className="h-10 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-10 shrink-0 rounded-xl bg-navy px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "جارٍ الحفظ..." : saved ? "تم الحفظ ✓" : "حفظ"}
      </button>
    </form>
  );
}
