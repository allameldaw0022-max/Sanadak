"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { describeSignInError } from "@/lib/authErrors";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.42-.22-2.05H12v3.94h6.6c-.13 1.09-.86 2.73-2.47 3.83l-.02.15 3.59 2.78.25.02c2.28-2.1 3.57-5.2 3.57-8.67"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.06 7.93-2.88l-3.78-2.93c-1.01.7-2.38 1.19-4.15 1.19-3.18 0-5.88-2.09-6.84-4.98l-.14.01-3.73 2.88-.05.13C3.24 21.29 7.28 24 12 24"
      />
      <path
        fill="#FBBC05"
        d="M5.16 14.4c-.25-.73-.4-1.51-.4-2.4s.15-1.67.39-2.4l-.01-.16-3.78-2.93-.12.06A11.95 11.95 0 0 0 0 12c0 1.93.47 3.76 1.24 5.4z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c2.25 0 3.77.97 4.64 1.78l3.38-3.3C17.94 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.24 6.6l3.91 3.03C6.12 6.84 8.82 4.75 12 4.75"
      />
    </svg>
  );
}

// Official Supabase Auth OAuth flow -- signInWithOAuth() redirects the
// browser to Google, then Google redirects back to /auth/callback with a
// PKCE code that route exchanges for a session. No custom OAuth handling,
// no separate credential storage: everything Google-related lives inside
// Supabase Auth exactly like the email/password flow already does.
//
// `next` (already validated against return-path.ts's allowlist by the
// caller) rides along as a plain query param on the callback URL so
// /auth/callback knows where to send the browser after the round trip to
// Google and back -- it re-validates the same value against the same
// allowlist itself before using it, so this component doesn't need to be
// trusted for that.
export function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (oauthError) {
      setLoading(false);
      setError(describeSignInError(oauthError));
    }
    // On success the browser navigates away to Google immediately -- no
    // further state update happens here.
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-navy transition-colors hover:bg-slate-50 disabled:opacity-60"
      >
        <GoogleLogo />
        {loading ? "جارٍ التحويل إلى Google..." : "المتابعة باستخدام Google"}
      </button>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
