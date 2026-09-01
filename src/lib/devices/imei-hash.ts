import { createHmac, timingSafeEqual } from "node:crypto";

// No explicit "server-only" import here (that package throws unconditionally
// outside a Next.js webpack build, which breaks vitest): the node:crypto
// import already makes this module unbundleable into a Client Component, the
// same boundary src/lib/security/hash.ts relies on. Kept in its own file,
// separate from the pure format helpers in imei-format.ts, so nothing that
// legitimately needs client-safe IMEI validation ever has a reason to import
// a module that touches IMEI_HASH_SECRET.

// HMAC-SHA256 with a server-only secret, NOT plain SHA-256: without a
// secret pepper, an attacker could precompute every Luhn-valid 15-digit
// IMEI (a feasible-sized set) into a lookup table and reverse any exposed
// hash back to its raw IMEI. imei_hash exists specifically so device_id/IMEI
// can be referenced safely in less-tightly-scoped places (logs, audit
// events) without storing the raw number there -- it must stay unreversible.
//
// IMEI_HASH_SECRET is a data-shape secret, not just an access secret: every
// stored device_imeis.imei_hash was computed with the CURRENT value of this
// variable. Rotating it later does not merely require re-authenticating
// something -- it silently makes every previously-stored hash unfindable by
// public_check_device_status, since a new secret produces different HMAC
// output for the same IMEI. There is no rotation/versioning support in this
// phase (adding one now would be speculative complexity ahead of any real
// need) -- so once this value is set in production, treat it as effectively
// permanent. If it must ever change, that requires a deliberate, planned
// migration that recomputes and rewrites every device_imeis.imei_hash row
// with the new secret first -- never a bare env var swap.
export function hashImei(normalizedImei: string): string {
  const secret = process.env.IMEI_HASH_SECRET;
  if (!secret) {
    throw new Error("IMEI_HASH_SECRET is not configured");
  }
  return createHmac("sha256", secret).update(normalizedImei).digest("hex");
}

export function imeiHashesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
