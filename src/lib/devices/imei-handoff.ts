// A short-lived, client-only, same-tab handoff of a just-checked IMEI from
// ImeiCheckForm to the registration/ownership-claim forms' first-load
// prefill -- deliberately NOT a query parameter (an IMEI must never appear
// in a URL, browser history, or referrer header, matching the same rule
// checkImeiAction already follows for the check itself) and NOT
// localStorage (nothing here is meant to persist beyond the current tab,
// let alone across browser restarts). sessionStorage never leaves the
// browser and is cleared when the tab closes -- it changes nothing about
// what any server ever sees, stores, or logs.
//
// This is a UX convenience only: the value is read once and discarded
// (consumeImeiHandoff always clears the key, whether or not it was still
// valid), and whatever ends up in the form field is still re-validated and
// re-hashed server-side by registerDeviceAction/submitOwnershipClaimAction
// exactly as if the user had typed it themselves -- this module never
// touches validation, hashing, or the database.

const STORAGE_KEY = "sanadak:imei-handoff";
// Long enough to survive a login detour (check -> "هل هذا جهازك؟" -> forced
// through /login -> back), short enough that a forgotten tab doesn't keep
// silently prefilling a stale number much later.
const TTL_MS = 10 * 60 * 1000;

export function stashImeiForHandoff(normalizedImei: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ imei: normalizedImei, expiresAt: Date.now() + TTL_MS })
    );
  } catch {
    // sessionStorage can throw (private browsing, storage disabled, quota)
    // -- prefill is a nicety the rest of the flow never depends on.
  }
}

// Consume-once: reads and immediately clears the stashed value, so a page
// refresh, a later unrelated visit, or a stale tab never keeps re-applying
// the same number.
export function consumeImeiHandoff(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { imei?: string; expiresAt?: number };
    if (!parsed.imei || !parsed.expiresAt || Date.now() > parsed.expiresAt) return null;
    return parsed.imei;
  } catch {
    return null;
  }
}
