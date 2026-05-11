import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CommitmentStatus, CommitmentCategory, ProofType, CoachTone } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    await request.json();

    const challenge = await prisma.challenge.findUnique({
      where: { token },
      include: {
        challenger: true,
        challenged: true,
      },
    });

    if (!challenge) {
      return NextResponse.json({ ok: false, error: "Challenge not found" }, { status: 404 });
    }

    if (challenge.status !== "PENDING") {
      return NextResponse.json({ ok: false, error: "Challenge already processed" }, { status: 400 });
    }

    // Create the commitment based on the challenge
    const commitment = await prisma.commitment.create({
      data: {
        slug: `${challenge.token}-${Date.now()}`,
        title: challenge.goal,
        description: `Challenge from ${challenge.challenger.username || "a peer"}`,
        category: CommitmentCategory.CUSTOM,
        proofType: ProofType.TEXT,
        coachTone: CoachTone.DRILL_SERGEANT,
        stakeAmountLamports: BigInt(Math.round(challenge.stakeSol * 1_000_000_000)),
        startDate: new Date(),
        endDate: new Date(Date.now() + challenge.durationDays * 24 * 60 * 60 * 1000),
        totalDays: challenge.durationDays,
        requiredProofDays: challenge.durationDays,
        status: CommitmentStatus.ACTIVE,
        makerId: challenge.challengedId,
      },
    });

    // Update challenge status
    await prisma.challenge.update({
      where: { token },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
        commitmentId: commitment.id,
      },
    });

    // Also make the challenger a believer by default? 
    // In a real on-chain scenario, they would have already staked.
    await prisma.belief.create({
      data: {
        commitmentId: commitment.id,
        believerId: challenge.challengerId,
        stakeAmountLamports: BigInt(Math.round(challenge.stakeSol * 1_000_000_000)),
        onchainTxSig: "CHALLENGE_STAKE_SIMULATED",
      },
    });

    return NextResponse.json({ ok: true, commitmentSlug: commitment.slug });
  } catch (error) {
    console.error("Challenge acceptance failed:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
