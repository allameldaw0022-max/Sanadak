import { createHmac, timingSafeEqual } from "node:crypto";

// No explicit "server-only" import here (that package throws unconditionally
// outside a Next.js webpack build, which breaks vitest): the node:crypto
// import already makes this module unbundleable into a Client Component, the
// same boundary src/lib/security/hash.ts relies on.

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

// HMAC-SHA256 with a server-only secret, NOT plain SHA-256: without a
// secret pepper, an attacker could precompute every Luhn-valid 15-digit
// IMEI (a feasible-sized set) into a lookup table and reverse any exposed
// hash back to its raw IMEI. imei_hash exists specifically so device_id/IMEI
// can be referenced safely in less-tightly-scoped places (logs, audit
// events) without storing the raw number there -- it must stay unreversible.
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
