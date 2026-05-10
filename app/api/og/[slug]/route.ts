import { createElement } from "react";
import { ImageResponse } from "next/og";
import { getCommitmentBySlug } from "@/lib/oath-data";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const commitment = await getCommitmentBySlug(slug);

  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  return new ImageResponse(
    createElement(
      "div",
      {
        style: {
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "64px",
          background:
            "radial-gradient(circle at top left, rgba(245,166,35,0.18), transparent 36%), linear-gradient(135deg, #09090b 0%, #121214 100%)",
          color: "white",
          fontFamily: "Inter, sans-serif",
          flexDirection: "column",
          justifyContent: "space-between",
        },
      },
      createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: 20 } },
        createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 60,
            },
          },
          createElement("img", {
            src: "https://oath-markets.vercel.app/logo.png",
            style: { objectFit: "contain", width: "100%", height: "100%" },
          })
        ),
        createElement(
          "div",
          { style: { fontSize: 22, color: "#8b8b9a" } },
          "Public commitment stakes on Solana"
        ),
        createElement(
          "div",
          { style: { fontSize: 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 1100 } },
          commitment.title
        ),
        createElement(
          "div",
          { style: { fontSize: 30, color: "#f2f2f5", maxWidth: 1100 } },
          `${commitment.makerHandle} · ${commitment.stakeLabel} staked · Day ${commitment.proofCount} of ${commitment.totalDays}`
        )
      ),
      createElement(
        "div",
        { style: { display: "flex", gap: 24, alignItems: "center", fontSize: 24 } },
        createElement("span", null, `${commitment.believerCount} believers`),
        createElement(
          "span",
          { style: { color: "#f5a623" } },
          `${commitment.progressPercent}% complete`
        )
      )
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
