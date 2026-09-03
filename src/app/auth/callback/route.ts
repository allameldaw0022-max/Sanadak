import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only OAuth (Google) lands here -- the existing signup-confirmation and
// password-recovery links still resolve client-side via detectSessionInUrl
// on /login and /reset-password respectively (see the comment on
// reset-password/page.tsx), unchanged by this route.
//
// exchangeCodeForSession() is the official @supabase/ssr server-side PKCE
// exchange: it reads the `code` Google/Supabase appended to this URL,
// verifies it against the PKCE verifier cookie signInWithOAuth() set in the
// browser, and on success sets the real session cookies via the
// createClient() cookie adapter. No token or secret ever passes through
// this route's own code -- Supabase Auth handles the exchange internally.
//
// The resulting auth.users row (new or existing) fires handle_new_user
// exactly like an email/password signup does -- same trigger, same
// profiles insert, same default role: 'user'. Nothing here creates or
// touches a profiles row directly.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  const next = "/";

  // Safe to log: Google/Supabase's own generic error reason (e.g. the user
  // denied consent, or the provider rejected the request) -- never the
  // authorization `code` itself (a one-time PKCE secret) and never
  // anything from exchangeCodeForSession's internals below, which could
  // include token material.
  if (oauthError) {
    console.error("Google OAuth callback error:", oauthError);
    return NextResponse.redirect(`${origin}/login?oauth_error=1`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("Google OAuth code exchange failed:", error.name, error.status, error.message);
    return NextResponse.redirect(`${origin}/login?oauth_error=1`);
  }

  return NextResponse.redirect(`${origin}/login?oauth_error=1`);
}
