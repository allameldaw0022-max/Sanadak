// A small, explicit allowlist for the optional "?next=" path /login and
// /auth/callback honor after a successful sign-in -- e.g. so the "هل هذا
// جهازك؟" / "سجّل هذا الجهاز الآن" CTAs from an IMEI check can send an
// unauthenticated visitor back to the exact page they meant to reach
// instead of always landing on "/".
//
// Every entry here is a fixed, known in-app route: the pages that redirect
// TO /login pass one of these literal strings themselves (never anything
// derived from user input), and every reader of "?next=" (the login page,
// the OAuth callback route) re-validates whatever it received against this
// same allowlist before ever using it as a redirect target. So even a
// hand-crafted /login?next=... link can only ever resolve to one of these
// known in-app pages -- never an absolute URL, a protocol-relative one
// (//evil.com), or anything else -- no open redirect is possible.
const ALLOWED_RETURN_PATHS = new Set(["/devices/new", "/devices/claims/new"]);

export function loginUrlWithReturn(returnPath: string): string {
  return ALLOWED_RETURN_PATHS.has(returnPath) ? `/login?next=${encodeURIComponent(returnPath)}` : "/login";
}

// Defaults to "/" (the pre-existing behavior) for anything not on the
// allowlist -- missing, empty, an absolute URL, a protocol-relative one, or
// simply not one of the known routes above.
export function sanitizeReturnPath(value: string | null | undefined): string {
  return value && ALLOWED_RETURN_PATHS.has(value) ? value : "/";
}
