import { NextResponse } from "next/server";
import {
  formatLamportsToSolLabel,
  generateCoachMessage,
} from "@/lib/coach-ai";
import { prisma } from "@/lib/prisma";
import { normalizeCoachTone } from "@/lib/coach-tone";

export const runtime = "nodejs";

type CoachInput = {
  commitmentSlug?: string;
  walletAddress?: string;
  content?: string;
};

type CoachThreadRecord = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  proofType: string;
  proofCount: number;
  requiredProofDays: number;
  totalDays: number;
  coachTone: string;
  maker: {
    walletAddress: string;
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
  const body = (await request.json()) as CoachInput;
  const slug = body.commitmentSlug?.trim();
  const walletAddress = body.walletAddress?.trim();
  const content = body.content?.trim();

  if (!slug || !walletAddress || !content) {
    return NextResponse.json(
      { ok: false, error: "commitmentSlug, walletAddress, and content are required" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  const commitment = (await prisma.commitment.findUnique({
    where: { slug },
    select: {
      id: true,
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
          walletAddress: true,
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
  })) as CoachThreadRecord | null;
  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { walletAddress },
    create: {
      walletAddress,
      timezone: commitment.maker.timezone,
      notifyTime: commitment.maker.notifyTime,
    },
    update: {},
  });

  await prisma.coachMessage.create({
    data: {
      commitmentId: commitment.id,
      userId: user.id,
      role: "USER",
      trigger: "DAILY_CHECKIN",
      content,
    },
  });

  const believerPoolSol = formatLamportsToSolLabel(
    commitment.beliefs.reduce((sum, belief) => sum + belief.stakeAmountLamports, 0n)
  );
  const coachMessage = await generateCoachMessage({
    event: "USER_REPLY",
    coachTone: normalizeCoachTone(commitment.coachTone),
    commitmentTitle: commitment.title,
    commitmentDescription: commitment.description,
    category: commitment.category,
    proofType: commitment.proofType,
    dayNumber: commitment.proofCount + 1,
    totalDays: commitment.totalDays,
    proofCount: commitment.proofCount,
    requiredProofDays: commitment.requiredProofDays,
    believerCount: commitment.beliefs.length,
    believerPoolSol,
    timezone: commitment.maker.timezone,
    notifyTime: commitment.maker.notifyTime,
    recentProofText:
      commitment.proofs[0]?.textContent ?? commitment.proofs[0]?.publicNote ?? null,
    recentUserReply: content,
    recentCoachMessage:
      commitment.coachMessages.find((message) => message.role === "COACH")?.content ??
      null,
  });

  await prisma.coachMessage.create({
    data: {
      commitmentId: commitment.id,
      userId: user.id,
      role: "COACH",
      trigger: "DAILY_CHECKIN",
      content: coachMessage,
    },
  });

  return NextResponse.json({
    ok: true,
    coachMessage: {
      role: "COACH",
      content: coachMessage,
    },
  });
}
