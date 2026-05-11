import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [proofs, beliefs, cheers] = await Promise.all([
      prisma.proof.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          commitment: {
            include: {
              maker: {
                select: { username: true, walletAddress: true }
              }
            }
          }
        }
      }),
      prisma.belief.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          believer: {
            select: { username: true, walletAddress: true }
          },
          commitment: true
        }
      }),
      prisma.cheer.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { username: true, walletAddress: true }
          },
          commitment: true
        }
      })
    ]);

    const activities = [
      ...proofs.map(p => ({
        id: p.id,
        type: "PROOF",
        user: p.commitment.maker.username || p.commitment.maker.walletAddress.slice(0, 8),
        target: p.commitment.title,
        slug: p.commitment.slug,
        timestamp: p.createdAt,
        message: `submitted Day ${p.dayNumber} proof`
      })),
      ...beliefs.map(b => ({
        id: b.id,
        type: "BELIEF",
        user: b.believer.username || b.believer.walletAddress.slice(0, 8),
        target: b.commitment.title,
        slug: b.commitment.slug,
        timestamp: b.createdAt,
        message: `staked ${Number(b.stakeAmountLamports) / 1_000_000_000} SOL on`
      })),
      ...cheers.map(c => ({
        id: c.id,
        type: "CHEER",
        user: c.author.username || c.author.walletAddress.slice(0, 8),
        target: c.commitment.title,
        slug: c.commitment.slug,
        timestamp: c.createdAt,
        message: `sent a cheer to`
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ ok: true, activities: activities.slice(0, 10) });
  } catch (error) {
    console.error("Activity fetch failed:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
