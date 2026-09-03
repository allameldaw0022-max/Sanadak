"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Shared password field for Login/Register, Forgot/Reset password, and any
// future change-password form -- hidden by default, toggled by the eye
// icon. The icon is an absolutely-positioned overlay (not a flex sibling)
// specifically so toggling type="password"/"text" never reflows the input
// or shifts surrounding layout.
export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = "••••••••",
  required,
  minLength,
  autoComplete,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={inputId}
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pl-11 text-sm outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        aria-pressed={visible}
        tabIndex={-1}
        className="absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-navy focus:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
      >
        {visible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}
