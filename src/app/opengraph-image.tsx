import { ImageResponse } from "next/og";

export const alt = "Watch Your Website Get Built. Live. Free. — Brand Vision Pros";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "radial-gradient(ellipse at 50% 0%, #3a2c12 0%, #070605 65%)",
          color: "#f5efe3",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, letterSpacing: 6, textTransform: "uppercase" }}>
          <div style={{ width: 16, height: 16, borderRadius: 999, background: "#e5383b" }} />
          Live on TikTok · Or Private Builds
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 36, fontSize: 84, lineHeight: 1.05, fontWeight: 700 }}>
          <span>Watch Your Website Get Built.</span>
          <span
            style={{
              backgroundImage: "linear-gradient(100deg, #f8ecc4, #e0bb63, #c99a3c)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Live. Free.
          </span>
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 32, color: "#b5ab98" }}>
          Love it? Keep it for $300. Not for you? You owe nothing.
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 28, color: "#e0bb63" }}>Brand Vision Pros</div>
      </div>
    ),
    size,
  );
}
