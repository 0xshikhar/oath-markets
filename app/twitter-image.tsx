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
          background: "linear-gradient(135deg, #f9f9f9 0%, #f3f3f4 100%)",
          color: "#131313",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 20, color: "#131313", letterSpacing: "0.18em", fontWeight: 700 }}>
            OATH
          </div>
          <div style={{ fontSize: 64, lineHeight: 1.03, fontWeight: 700, maxWidth: 1000 }}>
            Make a public oath. Stake real SOL. Follow through in public.
          </div>
          <div style={{ fontSize: 28, color: "#454932", maxWidth: 900 }}>
            Built for Solana, designed for accountability, and shareable by default.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 22, color: "#5f5e5e" }}>
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
