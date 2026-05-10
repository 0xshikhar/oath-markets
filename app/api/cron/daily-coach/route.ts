import { NextResponse } from "next/server";
import {
  formatLamportsToSolLabel,
  formatZonedDateKey,
  generateCoachMessage,
} from "@/lib/coach-ai";
import { prisma } from "@/lib/prisma";
import { normalizeCoachTone } from "@/lib/coach-tone";

export const runtime = "nodejs";

const DAY_MS = 24 * 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }
  if (!secret) {
    return false;
  }

  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    request.headers.get("x-cron-secret")?.trim() ||
    request.headers.get("x-webhook-secret")?.trim();

  return header === secret;
}

type DailyCoachCommitmentRecord = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  proofType: string;
  proofCount: number;
  requiredProofDays: number;
  totalDays: number;
  coachTone: string;
  startDate: Date;
  maker: {
    id: string;
    timezone: string;
    notifyTime: string;
    notifyPlatform: boolean;
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
    trigger: string;
  }>;
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      processed: 0,
      skipped: 0,
      reason: "DATABASE_URL is not configured",
    });
  }

  const now = new Date();
  const commitments = (await prisma.commitment.findMany({
    where: { status: "ACTIVE" },
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
      startDate: true,
      maker: {
        select: {
          id: true,
          timezone: true,
          notifyTime: true,
          notifyPlatform: true,
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
        take: 12,
        select: {
          role: true,
          content: true,
          createdAt: true,
          trigger: true,
        },
      },
    },
  })) as DailyCoachCommitmentRecord[];

  let processed = 0;
  let skipped = 0;

  for (const commitment of commitments) {
    if (!commitment.maker.notifyPlatform) {
      skipped += 1;
      continue;
    }

    const timezone = commitment.maker.timezone || "UTC";
    const notifyTime = commitment.maker.notifyTime || "09:00";

    const todayKey = formatZonedDateKey(now, timezone);
    const alreadySentToday = commitment.coachMessages.some(
      (message) => formatZonedDateKey(message.createdAt, timezone) === todayKey
    );

    if (alreadySentToday) {
      skipped += 1;
      continue;
    }

    const dayNumber = Math.max(
      1,
      Math.floor((now.getTime() - commitment.startDate.getTime()) / DAY_MS) + 1
    );
    const paceBaseline = Math.max(dayNumber - 1, 0);
    const paceDelta = commitment.proofCount - paceBaseline;
    const event = paceDelta < 0 ? "STREAK_RISK" : "DAILY_CHECKIN";
    const believerPoolSol = formatLamportsToSolLabel(
      commitment.beliefs.reduce((sum, belief) => sum + belief.stakeAmountLamports, 0n)
    );

    const coachMessage = await generateCoachMessage({
      event,
      coachTone: normalizeCoachTone(commitment.coachTone),
      commitmentTitle: commitment.title,
      commitmentDescription: commitment.description,
      category: commitment.category,
      proofType: commitment.proofType,
      dayNumber,
      totalDays: commitment.totalDays,
      proofCount: commitment.proofCount,
      requiredProofDays: commitment.requiredProofDays,
      believerCount: commitment.beliefs.length,
      believerPoolSol,
      timezone,
      notifyTime,
      recentProofText:
        commitment.proofs[0]?.textContent ?? commitment.proofs[0]?.publicNote ?? null,
      recentCoachMessage:
        commitment.coachMessages.find((message) => message.role === "COACH")?.content ??
        null,
    });

    await prisma.coachMessage.create({
      data: {
        commitmentId: commitment.id,
        userId: commitment.maker.id,
        role: "COACH",
        trigger: event,
        dayNumber,
        content: coachMessage,
      },
    });

    processed += 1;
  }

  return NextResponse.json({
    ok: true,
    processed,
    skipped,
  });
}
