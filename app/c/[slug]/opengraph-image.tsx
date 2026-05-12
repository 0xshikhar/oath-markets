import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const commitment = await prisma.commitment.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      totalDays: true,
      proofCount: true,
      stakeAmountLamports: true,
      maker: {
        select: {
          username: true,
          walletAddress: true,
        },
      },
    },
  });

  if (!commitment) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#131313", color: "white", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
          OATH Markets
        </div>
      ),
      size
    );
  }

  const makerHandle = commitment.maker.username ? `@${commitment.maker.username}` : commitment.maker.walletAddress.slice(0, 4) + "..." + commitment.maker.walletAddress.slice(-4);
  const stakeSol = Number(commitment.stakeAmountLamports) / 1_000_000_000;

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
          background: "linear-gradient(135deg, #131313 0%, #1a1a1a 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ background: "#dfff00", color: "#131313", padding: "6px 12px", borderRadius: 4, fontWeight: 900, fontSize: 18, letterSpacing: "0.1em" }}>OATH</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 20, fontWeight: 500 }}>Live Arena Performance</div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 24 }}>
            <div style={{ fontSize: 24, color: "#dfff00", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{makerHandle} is on Fire</div>
            <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1, maxWidth: 1000 }}>{commitment.title}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 48 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", fontWeight: 500, textTransform: "uppercase" }}>Current Streak</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: "white" }}>Day {commitment.proofCount} / {commitment.totalDays}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", fontWeight: 500, textTransform: "uppercase" }}>Skin in Game</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: "#dfff00" }}>{stakeSol} SOL</div>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Verified on Solana</div>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>oath.markets</div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
