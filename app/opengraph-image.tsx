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
            "radial-gradient(circle at top left, rgba(245,166,35,0.22), transparent 34%), radial-gradient(circle at 80% 20%, rgba(59,130,246,0.16), transparent 28%), linear-gradient(135deg, #09090b 0%, #111113 100%)",
          color: "#f2f2f5",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              borderRadius: 999,
              padding: "10px 18px",
              background: "rgba(245,166,35,0.14)",
              color: "#f5a623",
              letterSpacing: "0.18em",
              fontSize: 20,
            }}
          >
            OATH
          </div>
          <div style={{ fontSize: 22, color: "#8b8b9a" }}>
            Public commitment stakes on Solana
          </div>
          <div style={{ fontSize: 72, lineHeight: 1.03, fontWeight: 700, maxWidth: 1060 }}>
            Make a public oath. Stake real SOL. Follow through in public.
          </div>
          <div style={{ fontSize: 30, color: "#f2f2f5", maxWidth: 980 }}>
            Public streak pages, AI coach nudges, believer co-stakes, and
            portable reputation built for the Frontier demo and beyond.
          </div>
        </div>
        <div style={{ display: "flex", gap: 18, fontSize: 24, color: "#d4d4d8" }}>
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
