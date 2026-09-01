import { describe, expect, it } from "vitest";
import { isValidImei, isValidImeiLuhn, normalizeImei } from "../imei-format";

describe("normalizeImei", () => {
  it("strips spaces, dashes, and non-digit characters", () => {
    expect(normalizeImei("IMEI: 49-015420 3237518")).toBe("490154203237518");
  });
});

describe("isValidImeiLuhn", () => {
  it("accepts a known-valid IMEI", () => {
    expect(isValidImeiLuhn("490154203237518")).toBe(true);
  });

  it("rejects the same number with the last digit changed", () => {
    expect(isValidImeiLuhn("490154203237519")).toBe(false);
  });

  it("rejects anything that isn't exactly 15 digits", () => {
    expect(isValidImeiLuhn("12345")).toBe(false);
    expect(isValidImeiLuhn("4901542032375180")).toBe(false);
    expect(isValidImeiLuhn("49015420323751a")).toBe(false);
  });
});

describe("isValidImei", () => {
  it("normalizes then Luhn-validates in one call", () => {
    expect(isValidImei("49-0154203237518")).toBe(true);
  });

  it("rejects a malformed input even after normalization", () => {
    expect(isValidImei("not an imei")).toBe(false);
  });
});
