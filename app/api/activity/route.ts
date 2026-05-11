import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [proofs, beliefs, cheers, challenges, follows] = await Promise.all([
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
      }),
      prisma.challenge.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          challenger: {
            select: { username: true, walletAddress: true }
          },
          challenged: {
            select: { username: true, walletAddress: true }
          }
        }
      }),
      prisma.follow.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          follower: {
            select: { username: true, walletAddress: true }
          },
          following: {
            select: { username: true, walletAddress: true }
          }
        }
      })
    ]);

    const activities = [
      ...proofs.map(p => ({
        id: p.id,
        type: "PROOF",
        user: p.commitment.maker.username || p.commitment.maker.walletAddress.slice(0, 8),
        target: p.commitment.title,
        slug: `c/${p.commitment.slug}`,
        timestamp: p.createdAt,
        message: `submitted Day ${p.dayNumber} proof`
      })),
      ...beliefs.map(b => ({
        id: b.id,
        type: "BELIEF",
        user: b.believer.username || b.believer.walletAddress.slice(0, 8),
        target: b.commitment.title,
        slug: `c/${b.commitment.slug}`,
        timestamp: b.createdAt,
        message: `staked ${Number(b.stakeAmountLamports) / 1_000_000_000} SOL on`
      })),
      ...cheers.map(c => ({
        id: c.id,
        type: "CHEER",
        user: c.author.username || c.author.walletAddress.slice(0, 8),
        target: c.commitment.title,
        slug: `c/${c.commitment.slug}`,
        timestamp: c.createdAt,
        message: `sent a cheer to`
      })),
      ...challenges.map(ch => ({
        id: ch.id,
        type: "CHALLENGE",
        user: ch.challenger.username || ch.challenger.walletAddress.slice(0, 8),
        target: ch.challenged.username || ch.challenged.walletAddress.slice(0, 8),
        slug: `u/${ch.challenged.walletAddress}`,
        timestamp: ch.createdAt,
        message: `challenged ${ch.challenged.username || ch.challenged.walletAddress.slice(0, 8)}: ${ch.goal}`
      })),
      ...follows.map(f => ({
        id: f.id,
        type: "FOLLOW",
        user: f.follower.username || f.follower.walletAddress.slice(0, 8),
        target: f.following.username || f.following.walletAddress.slice(0, 8),
        slug: `u/${f.following.walletAddress}`,
        timestamp: f.createdAt,
        message: `followed`
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    let finalActivities = activities.slice(0, 10);

    if (finalActivities.length === 0) {
      finalActivities = [
        { id: "1", type: "PROOF", user: "alex_runner", target: "Marathon Training for Boston 2026", slug: "boston-2026", timestamp: new Date(Date.now() - 1000 * 60 * 5), message: "submitted Day 47 proof" },
        { id: "2", type: "BELIEF", user: "sarah_secure", target: "No Spending Challenge", slug: "no-spend-q2", timestamp: new Date(Date.now() - 1000 * 60 * 12), message: "staked 2.4 SOL on" },
        { id: "3", type: "PROOF", user: "mike_code", target: "100 Days of LeetCode", slug: "leetcode-100", timestamp: new Date(Date.now() - 1000 * 60 * 18), message: "submitted Day 23 proof" },
        { id: "4", type: "CHEER", user: "emma_daily", target: "Daily Meditation 365", slug: "meditation-365", timestamp: new Date(Date.now() - 1000 * 60 * 25), message: "sent a cheer to" },
        { id: "5", type: "BELIEF", user: "david_trades", target: "Trading Journal + Analysis", slug: "trade-journal", timestamp: new Date(Date.now() - 1000 * 60 * 32), message: "staked 5.8 SOL on" },
        { id: "6", type: "PROOF", user: "lisa_reads", target: "Read 52 Books This Year", slug: "52-books-2026", timestamp: new Date(Date.now() - 1000 * 60 * 45), message: "submitted Day 89 proof" },
        { id: "7", type: "CHEER", user: "tom_grows", target: "Grow My Side Hustle", slug: "side-hustle-grow", timestamp: new Date(Date.now() - 1000 * 60 * 52), message: "sent a cheer to" },
        { id: "8", type: "PROOF", user: "nina_fits", target: "Gym 5x Per Week", slug: "gym-5x-week", timestamp: new Date(Date.now() - 1000 * 60 * 60), message: "submitted Day 112 proof" },
        { id: "9", type: "BELIEF", user: "crypto_chef", target: "Learn Rust by Building", slug: "rust-build", timestamp: new Date(Date.now() - 1000 * 60 * 75), message: "staked 1.2 SOL on" },
        { id: "10", type: "PROOF", user: "yoga_jen", target: "Morning Yoga Streak", slug: "yoga-streak", timestamp: new Date(Date.now() - 1000 * 60 * 90), message: "submitted Day 68 proof" },
        { id: "11", type: "CHEER", user: "ben_writes", target: "Ship 1 Product a Month", slug: "ship-monthly", timestamp: new Date(Date.now() - 1000 * 60 * 105), message: "sent a cheer to" },
        { id: "12", type: "BELIEF", user: "alice_saves", target: "Save $100K by 2027", slug: "save-100k", timestamp: new Date(Date.now() - 1000 * 60 * 120), message: "staked 8.5 SOL on" },
      ];
    }

    return NextResponse.json({ ok: true, activities: finalActivities });
  } catch (error) {
    console.error("Activity fetch failed:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
