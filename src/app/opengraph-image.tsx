import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "سندك | فحص وتوثيق الأجهزة";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Read once at module scope (predictable value, no request-time data) so the
// image is generated statically at build time instead of per-request.
//
// A single custom font weight is used deliberately: satori (via next/og)
// fails to resolve glyphs when two TTFs sharing the same underlying font
// family ("Cairo") are registered together in the `fonts` array, even when
// only one is referenced -- confirmed by bisecting a build failure down to
// that exact combination. One weight sidesteps the collision entirely.
const [cairo, logoData] = await Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Cairo-ExtraBold.ttf")),
  readFile(join(process.cwd(), "public/logo-mark.png")),
]);
const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          position: "relative",
          fontFamily: "Cairo",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <img src={logoSrc} alt="" width={168} height={168} style={{ borderRadius: 36 }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ display: "flex", fontSize: 88, color: "#ffffff" }}>سندك</span>
            <span
              style={{
                display: "flex",
                fontSize: 26,
                color: "#4ade80",
                letterSpacing: "4px",
                marginTop: -6,
              }}
            >
              SANADAK
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 44,
            fontSize: 32,
            color: "#cbd5e1",
            textAlign: "center",
          }}
        >
          منصة سودانية للتحقق من الأجهزة وتوثيق ملكيتها
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 18,
            background: "#16a34a",
            display: "flex",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Cairo", data: cairo, style: "normal", weight: 800 }],
    }
  );
}
