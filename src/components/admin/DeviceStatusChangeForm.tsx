"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { transitionDeviceStatusAction } from "@/app/admin/devices/actions";
import type { Database } from "@/lib/supabase/database.types";

type DeviceStatus = Database["public"]["Enums"]["device_status"];

const STATUS_LABEL: Record<DeviceStatus, string> = {
  ACTIVE: "نشط",
  UNDER_REVIEW: "قيد المراجعة",
  LOST: "مفقود",
  STOLEN: "مسروق",
  RECOVERED: "مسترجع",
  BLOCKED: "محظور",
};

// Mirrors is_valid_device_status_transition() in the database exactly --
// UI convenience only (narrows the dropdown to sensible choices). The RPC
// itself re-validates and is the only real enforcement; a mismatch here
// would just show an error, never allow an invalid transition through.
const VALID_NEXT: Record<DeviceStatus, DeviceStatus[]> = {
  ACTIVE: ["UNDER_REVIEW", "LOST", "STOLEN", "BLOCKED"],
  UNDER_REVIEW: ["ACTIVE", "LOST", "STOLEN", "BLOCKED"],
  LOST: ["UNDER_REVIEW", "RECOVERED", "STOLEN", "BLOCKED"],
  STOLEN: ["UNDER_REVIEW", "RECOVERED", "LOST", "BLOCKED"],
  RECOVERED: ["ACTIVE", "BLOCKED"],
  BLOCKED: ["ACTIVE", "UNDER_REVIEW"],
};

export function DeviceStatusChangeForm({ deviceId, currentStatus }: { deviceId: string; currentStatus: DeviceStatus }) {
  const router = useRouter();
  const options = VALID_NEXT[currentStatus] ?? [];
  const [newStatus, setNewStatus] = useState<DeviceStatus | "">(options[0] ?? "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (options.length === 0) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newStatus) return;
    setError(null);
    startTransition(async () => {
      const result = await transitionDeviceStatusAction(deviceId, newStatus, reason.trim() || null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReason("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-sm font-bold text-navy">تغيير حالة الجهاز</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as DeviceStatus)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-navy outline-none focus:border-primary sm:w-44"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {STATUS_LABEL[opt]}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="سبب التغيير (اختياري)"
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
