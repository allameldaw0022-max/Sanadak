import { describe, expect, it } from "vitest";
import { safeJsonLd } from "../utils";

describe("safeJsonLd", () => {
  it("neutralizes a </script> breakout attempt in a JSON-LD field", () => {
    const malicious = { name: '</script><script>alert(document.cookie)</script>' };
    const output = safeJsonLd(malicious);
    expect(output).not.toContain("</script>");
    expect(output).not.toContain("<script>");
    // still valid JSON carrying the original value once parsed
    expect(JSON.parse(output.replace(/\\u003c/g, "<"))).toEqual(malicious);
  });

  it("produces JSON that round-trips to the same value", () => {
    const data = { name: "سندك", rating: 4.5, nested: { a: [1, 2, 3] } };
    const output = safeJsonLd(data);
    expect(JSON.parse(output)).toEqual(data);
  });
});
