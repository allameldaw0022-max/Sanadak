import { describe, expect, it } from "vitest";
import { parseManifest } from "../manifest";
import { buildMinimalManifestAxml } from "./test-helpers";

describe("parseManifest (AXML)", () => {
  it("extracts package name and permissions from a spec-correct binary manifest", () => {
    const manifest = parseManifest(buildMinimalManifestAxml());
    expect(manifest.packageName).toBe("sd.example.app");
    expect(manifest.permissions).toEqual(["android.permission.INTERNET"]);
  });

  it("throws (caught upstream, never crashes the process) on garbage input", () => {
    expect(() => parseManifest(Buffer.from("not an axml file at all"))).toThrow();
  });
});
