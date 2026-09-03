import { describe, expect, it } from "vitest";
import { getDeviceUsageState } from "../utils";

describe("getDeviceUsageState", () => {
  it("10/30 (~33%) is normal", () => {
    expect(getDeviceUsageState(10, 30)).toBe("normal");
  });

  it("25/30 (~83%) is near -- crosses the 80% threshold", () => {
    expect(getDeviceUsageState(25, 30)).toBe("near");
  });

  it("29/30 (~97%) is near", () => {
    expect(getDeviceUsageState(29, 30)).toBe("near");
  });

  it("30/30 (100%) is reached", () => {
    expect(getDeviceUsageState(30, 30)).toBe("reached");
  });

  it("just under 80% (23/30) is still normal", () => {
    expect(getDeviceUsageState(23, 30)).toBe("normal");
  });

  it("over the limit is still reached, not a new state", () => {
    expect(getDeviceUsageState(31, 30)).toBe("reached");
  });

  it("0/50 (the advanced plan's limit) is normal", () => {
    expect(getDeviceUsageState(0, 50)).toBe("normal");
  });
});
