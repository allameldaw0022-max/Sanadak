import { describe, expect, it } from "vitest";
import { buildImeiCheckDisclosure } from "../check-response";

describe("buildImeiCheckDisclosure", () => {
  it("discloses ACTIVE with its message", () => {
    const result = buildImeiCheckDisclosure("ACTIVE");
    expect(result).toEqual({ disclosed: true, status: "ACTIVE", message: expect.any(String) });
  });

  it("discloses UNDER_REVIEW, LOST, STOLEN, RECOVERED each with a message", () => {
    for (const status of ["UNDER_REVIEW", "LOST", "STOLEN", "RECOVERED"] as const) {
      const result = buildImeiCheckDisclosure(status);
      expect(result.disclosed).toBe(true);
      if (result.disclosed) {
        expect(result.status).toBe(status);
        expect(result.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("never discloses BLOCKED", () => {
    const result = buildImeiCheckDisclosure("BLOCKED");
    expect(result.disclosed).toBe(false);
  });

  it("produces the exact same response for BLOCKED and for 'not found' (null)", () => {
    const blocked = buildImeiCheckDisclosure("BLOCKED");
    const notFound = buildImeiCheckDisclosure(null);
    expect(blocked).toEqual(notFound);
  });

  it("never puts owner/device identifiers anywhere in the response shape", () => {
    for (const status of ["ACTIVE", "UNDER_REVIEW", "LOST", "STOLEN", "RECOVERED", "BLOCKED", null] as const) {
      const result = buildImeiCheckDisclosure(status);
      const keys = Object.keys(result);
      expect(keys).not.toContain("owner_id");
      expect(keys).not.toContain("device_id");
      expect(keys).not.toContain("email");
      expect(keys).not.toContain("phone");
      expect(keys).not.toContain("evidence");
    }
  });
});
