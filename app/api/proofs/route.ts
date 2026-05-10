import { NextResponse } from "next/server";
import { formatLamportsToSolLabel, generateCoachMessage } from "@/lib/coach-ai";
import { prisma } from "@/lib/prisma";
import { getCommitmentBySlug } from "@/lib/oath-data";
import { normalizeCoachTone } from "@/lib/coach-tone";

export const runtime = "nodejs";

type ProofInput = {
  commitmentSlug?: string;
  walletAddress?: string;
  dayNumber?: number;
  textContent?: string;
  imageUrl?: string;
  linkUrl?: string;
  publicNote?: string;
  contentHash?: string;
  onchainTxSig?: string;
};

type ProofCoachContextRecord = {
  title: string;
  description: string | null;
  category: string;
  proofType: string;
  proofCount: number;
  requiredProofDays: number;
  totalDays: number;
  coachTone: string;
  maker: {
    timezone: string;
    notifyTime: string;
  };
  beliefs: Array<{
    stakeAmountLamports: bigint;
  }>;
  proofs: Array<{
    textContent: string | null;
    publicNote: string | null;
  }>;
  coachMessages: Array<{
    role: "COACH" | "USER";
    content: string;
    createdAt: Date;
  }>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as ProofInput;
  const slug = body.commitmentSlug?.trim();
  const walletAddress = body.walletAddress?.trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "commitmentSlug is required" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  if (!walletAddress) {
    return NextResponse.json(
      { ok: false, error: "walletAddress is required" },
      { status: 400 }
    );
  }

  if (!body.onchainTxSig?.trim()) {
    return NextResponse.json(
      { ok: false, error: "On-chain transaction is required" },
      { status: 400 }
    );
  }

  const commitment = await prisma.commitment.findUnique({ where: { slug } });
  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { walletAddress },
    create: { walletAddress },
    update: {},
  });

  const proofDay = body.dayNumber ?? Math.max(commitment.proofCount + 1, 1);
  await prisma.proof.create({
    data: {
      commitmentId: commitment.id,
      dayNumber: proofDay,
      textContent: body.textContent?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
      linkUrl: body.linkUrl?.trim() || null,
      publicNote: body.publicNote?.trim() || null,
      contentHash: body.contentHash?.trim() || null,
      onchainTxSig: body.onchainTxSig.trim(),
    },
  });

  await prisma.commitment.update({
    where: { id: commitment.id },
    data: { proofCount: { increment: 1 } },
  });

  const commitmentWithCoachContext = (await prisma.commitment.findUnique({
    where: { id: commitment.id },
    select: {
      title: true,
      description: true,
      category: true,
      proofType: true,
      proofCount: true,
      requiredProofDays: true,
      totalDays: true,
      coachTone: true,
      maker: {
        select: {
          timezone: true,
          notifyTime: true,
        },
      },
      beliefs: {
        select: {
          stakeAmountLamports: true,
        },
      },
      proofs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          textContent: true,
          publicNote: true,
        },
      },
      coachMessages: {
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
  })) as ProofCoachContextRecord | null;

  const believerPoolSol = formatLamportsToSolLabel(
    commitmentWithCoachContext?.beliefs.reduce(
      (sum, belief) => sum + belief.stakeAmountLamports,
      0n
    ) ?? 0n
  );
  const coachMessage = await generateCoachMessage({
    event: "PROOF_SUBMITTED",
    coachTone: normalizeCoachTone(commitmentWithCoachContext?.coachTone),
    commitmentTitle: commitmentWithCoachContext?.title ?? commitment.title,
    commitmentDescription: commitmentWithCoachContext?.description,
    category: commitmentWithCoachContext?.category ?? commitment.category,
    proofType: commitmentWithCoachContext?.proofType ?? commitment.proofType,
    dayNumber: proofDay,
    totalDays: commitmentWithCoachContext?.totalDays ?? commitment.totalDays,
    proofCount: commitmentWithCoachContext?.proofCount ?? commitment.proofCount + 1,
    requiredProofDays:
      commitmentWithCoachContext?.requiredProofDays ?? commitment.requiredProofDays,
    believerCount: commitmentWithCoachContext?.beliefs.length ?? 0,
    believerPoolSol,
    timezone: commitmentWithCoachContext?.maker.timezone ?? "UTC",
    notifyTime: commitmentWithCoachContext?.maker.notifyTime ?? "09:00",
    recentProofText:
      commitmentWithCoachContext?.proofs[0]?.textContent ??
      commitmentWithCoachContext?.proofs[0]?.publicNote ??
      body.textContent?.trim() ??
      null,
    recentUserReply: null,
    recentCoachMessage:
      commitmentWithCoachContext?.coachMessages.find((message) => message.role === "COACH")
        ?.content ?? null,
  });

  await prisma.coachMessage.create({
    data: {
      commitmentId: commitment.id,
      userId: user.id,
      role: "COACH",
      trigger: "PROOF_SUBMITTED",
      dayNumber: proofDay,
      content: coachMessage,
    },
  });

  const updatedCommitment = await getCommitmentBySlug(slug);
  if (!updatedCommitment) {
    return NextResponse.json(
      { ok: false, error: "Failed to load updated commitment" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    commitment: updatedCommitment,
    coachMessage,
  });
}
