import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Top Streaks (by proofCount)
    const topStreaks = await prisma.commitment.findMany({
      where: { status: "ACTIVE", isPublic: true },
      orderBy: { proofCount: "desc" },
      take: 5,
      include: {
        maker: {
          select: {
            username: true,
            walletAddress: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Top Stakes (by stakeAmountLamports)
    const topStakes = await prisma.commitment.findMany({
      where: { status: "ACTIVE", isPublic: true },
      orderBy: { stakeAmountLamports: "desc" },
      take: 5,
      include: {
        maker: {
          select: {
            username: true,
            walletAddress: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Top Believers (by number of beliefs)
    const topBelievers = await prisma.commitment.findMany({
      where: { status: "ACTIVE", isPublic: true },
      orderBy: {
        beliefs: {
          _count: "desc",
        },
      },
      take: 5,
      include: {
        maker: {
          select: {
            username: true,
            walletAddress: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            beliefs: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      leaderboards: {
        streaks: topStreaks.map(c => ({
          slug: c.slug,
          title: c.title,
          maker: c.maker,
          value: c.proofCount,
          label: "Proofs",
        })),
        stakes: topStakes.map(c => ({
          slug: c.slug,
          title: c.title,
          maker: c.maker,
          value: Number(c.stakeAmountLamports) / 1_000_000_000,
          label: "SOL",
        })),
        believers: topBelievers.map(c => ({
          slug: c.slug,
          title: c.title,
          maker: c.maker,
          value: c._count.beliefs,
          label: "Believers",
        })),
      },
    });
  } catch (error) {
    console.error("Leaderboard fetch failed:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
