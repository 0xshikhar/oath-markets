import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
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
            "radial-gradient(circle at top left, rgba(223,255,0,0.22), transparent 34%), radial-gradient(circle at 80% 20%, rgba(19,19,19,0.08), transparent 28%), linear-gradient(135deg, #f9f9f9 0%, #f3f3f4 100%)",
          color: "#131313",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              borderRadius: 4,
              padding: "10px 18px",
              background: "#dfff00",
              color: "#131313",
              letterSpacing: "0.22em",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            OATH
          </div>
          <div style={{ fontSize: 22, color: "#5f5e5e" }}>
            Public commitment stakes on Solana
          </div>
          <div style={{ fontSize: 72, lineHeight: 1.03, fontWeight: 700, maxWidth: 1060 }}>
            Make a public oath. Stake real SOL. Follow through in public.
          </div>
          <div style={{ fontSize: 30, color: "#454932", maxWidth: 980 }}>
            Public streak pages, AI coach nudges, believer co-stakes, and
            portable reputation built for the Frontier demo and beyond.
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#5f5e5e" }}>
          <span>Escrow</span>
          <span>•</span>
          <span>Proof feed</span>
          <span>•</span>
          <span>Reputation</span>
          <span>•</span>
          <span>AI coach</span>
        </div>
      </div>
    ),
    size
  );
}
