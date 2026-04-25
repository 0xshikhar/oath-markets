import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "64px",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #09090b 0%, #131316 100%)",
          color: "#f2f2f5",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 20, color: "#f5a623", letterSpacing: "0.18em" }}>
            OATH
          </div>
          <div style={{ fontSize: 64, lineHeight: 1.03, fontWeight: 700, maxWidth: 1000 }}>
            Make a public oath. Stake real SOL. Follow through in public.
          </div>
          <div style={{ fontSize: 28, color: "#a1a1aa", maxWidth: 900 }}>
            Built for Solana, designed for accountability, and shareable by default.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 22, color: "#e4e4e7" }}>
          <span>Explore</span>
          <span>•</span>
          <span>Create</span>
          <span>•</span>
          <span>Dashboard</span>
        </div>
      </div>
    ),
    size
  );
}
