import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "node:crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ ok: false, error: "Missing token" }, { status: 400 });
  }

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { token },
      include: {
        challenger: {
          select: {
            username: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
        challenged: {
          select: {
            username: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
      },
    });

    if (!challenge) {
      return NextResponse.json({ ok: false, error: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, challenge });
  } catch (error) {
    console.error("Failed to fetch challenge:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challengerWallet, challengedWallet, goal, durationDays, stakeSol } = body;

    if (!challengerWallet || !challengedWallet || !goal || !durationDays || !stakeSol) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Ensure both users exist
    const [challenger, challenged] = await Promise.all([
      prisma.user.findUnique({ where: { walletAddress: challengerWallet } }),
      prisma.user.findUnique({ where: { walletAddress: challengedWallet } }),
    ]);

    if (!challenger || !challenged) {
      return NextResponse.json({ ok: false, error: "Users not found" }, { status: 404 });
    }

    const challenge = await prisma.challenge.create({
      data: {
        challengerId: challenger.id,
        challengedId: challenged.id,
        goal,
        durationDays,
        stakeSol,
        token: randomBytes(5).toString("hex"),
      },
    });

    return NextResponse.json({ ok: true, challenge });
  } catch (error) {
    console.error("Failed to create challenge:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
