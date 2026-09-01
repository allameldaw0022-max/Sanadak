import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { hashImei, imeiHashesMatch } from "../imei-hash";

describe("hashImei", () => {
  const ORIGINAL_SECRET = process.env.IMEI_HASH_SECRET;

  beforeEach(() => {
    process.env.IMEI_HASH_SECRET = "test-only-secret";
  });

  afterAll(() => {
    process.env.IMEI_HASH_SECRET = ORIGINAL_SECRET;
  });

  it("is deterministic for the same input and secret", () => {
    expect(hashImei("490154203237518")).toBe(hashImei("490154203237518"));
  });

  it("differs for different IMEIs", () => {
    expect(hashImei("490154203237518")).not.toBe(hashImei("112345678901236"));
  });

  it("differs for the same IMEI under a different secret (proves rotation breaks lookups)", () => {
    const hashA = hashImei("490154203237518");
    process.env.IMEI_HASH_SECRET = "a-different-secret";
    const hashB = hashImei("490154203237518");
    expect(hashA).not.toBe(hashB);
  });

  it("throws if IMEI_HASH_SECRET is not configured", () => {
    delete process.env.IMEI_HASH_SECRET;
    expect(() => hashImei("490154203237518")).toThrow("IMEI_HASH_SECRET");
  });
});

describe("imeiHashesMatch", () => {
  it("returns true for identical hashes and false for different ones", () => {
    process.env.IMEI_HASH_SECRET = "test-only-secret";
    const a = hashImei("490154203237518");
    const b = hashImei("490154203237518");
    const c = hashImei("112345678901236");
    expect(imeiHashesMatch(a, b)).toBe(true);
    expect(imeiHashesMatch(a, c)).toBe(false);
  });
});
