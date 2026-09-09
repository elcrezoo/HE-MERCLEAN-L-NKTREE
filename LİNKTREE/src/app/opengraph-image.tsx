import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "HeimerClean — silent Windows optimization";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public", "brand", "heimerclean-character.png"), "base64");

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: 80, background: "#222326", color: "#fff", fontFamily: "sans-serif", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 78% 22%, rgba(215,255,63,.18), transparent 38%)" }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${logo}`} alt="" width={72} height={72} style={{ objectFit: "contain" }}/>
          <span style={{ fontWeight: 700 }}>HeimerClean</span>
        </div>
        <div style={{ fontSize: 70, lineHeight: 1.05, fontWeight: 700, maxWidth: 900, marginTop: 65 }}>Quiet intelligence for healthier Windows devices.</div>
        <div style={{ color: "#d7ff3f", fontSize: 24, marginTop: 35 }}>On-device AI · Silent optimization · Windows</div>
      </div>
    </div>, size,
  );
}
