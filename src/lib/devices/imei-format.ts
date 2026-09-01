// Pure, side-effect-free IMEI format helpers -- no secret, no I/O, no
// node:crypto import. Deliberately kept in its own module, separate from
// imei-hash.ts (which reads IMEI_HASH_SECRET): this file is safe to import
// from anywhere, including a future Client Component that wants instant
// format feedback on an input field, without risking ever pulling the
// secret-consuming code (or the node:crypto import that would fail to
// bundle for the browser anyway) along with it.

// GSMA TS.06 Luhn checksum for a normalized 15-digit IMEI.
export function isValidImeiLuhn(imei: string): boolean {
  if (!/^[0-9]{15}$/.test(imei)) return false;

  let total = 0;
  let doubleIt = false;
  for (let i = imei.length - 1; i >= 0; i--) {
    let digit = Number(imei[i]);
    if (doubleIt) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    total += digit;
    doubleIt = !doubleIt;
  }
  return total % 10 === 0;
}

// Strips everything but digits (spaces, dashes, "IMEI:" prefixes users paste
// in) before any format/Luhn/uniqueness check ever runs, so the same number
// typed two different ways is always treated as the same IMEI.
export function normalizeImei(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export function isValidImei(raw: string): boolean {
  const normalized = normalizeImei(raw);
  return normalized.length === 15 && isValidImeiLuhn(normalized);
}
