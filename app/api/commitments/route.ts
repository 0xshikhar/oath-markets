import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { normalizeCoachTone } from "@/lib/coach-tone";
import { prisma } from "@/lib/prisma";
import { getCommitmentBySlug, type CommitmentDetail } from "@/lib/oath-data";

const DAY_MS = 24 * 60 * 60 * 1000;

type CommitmentCreateInput = {
  walletAddress?: string;
  title?: string;
  description?: string;
  category?: string;
  proofType?: string;
  coachTone?: string;
  stakeAmountSol?: number;
  durationDays?: number;
  visibility?: "PUBLIC" | "PRIVATE";
  slashDestination?: "BURN" | "DONATE" | "TREASURY";
  timezone?: string;
  notifyTime?: string;
  worldIdVerified?: boolean;
  onchainAddress?: string;
  onchainTxSig?: string;
};

type CommitmentCategory =
  | "FITNESS"
  | "LEARNING"
  | "CREATIVE"
  | "WORK"
  | "HEALTH"
  | "FINANCIAL"
  | "CUSTOM";

type ProofType =
  | "TEXT"
  | "PHOTO"
  | "LINK"
  | "GITHUB_COMMIT"
  | "CUSTOM";

type SlashDestination = "BURN" | "DONATE" | "TREASURY";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function makeFallbackCommitment(input: CommitmentCreateInput, slug: string): CommitmentDetail {
  const now = new Date();
  const durationDays = input.durationDays ?? 30;
  const stakeAmountSol = input.stakeAmountSol ?? 1;

  return {
    slug,
    title: input.title ?? "Untitled oath",
    description: input.description ?? "",
    category: input.category ?? "CUSTOM",
    proofType: input.proofType ?? "TEXT",
    makerName: "You",
    makerHandle: input.walletAddress ? `@${input.walletAddress.slice(0, 6)}` : "@maker",
    makerWalletAddress: input.walletAddress ?? "demo-wallet",
    makerVerified: Boolean(input.worldIdVerified),
    onchainAddress: input.onchainAddress ?? null,
    stakeLabel: `${stakeAmountSol} SOL`,
    believerCount: 0,
    proofCount: 0,
    totalDays: durationDays,
    daysRemaining: durationDays,
    progressPercent: 0,
    status: "ACTIVE",
    statusLabel: "ACTIVE",
    createdAtIso: now.toISOString(),
    createdAtLabel: "Today",
    endDateLabel: new Date(now.getTime() + durationDays * DAY_MS).toDateString(),
    publicUrl: `/c/${slug}`,
    completionRatioLabel: "0%",
    startDateLabel: now.toDateString(),
    proofSamples: [],
    comments: [],
    coachMessages: [],
  };
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as CommitmentCreateInput;
  const title = payload.title?.trim() || "Untitled oath";
  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  const stakeAmountLamports = BigInt(Math.round((payload.stakeAmountSol ?? 1) * 1_000_000_000));
  const durationDays = payload.durationDays ?? 30;
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + durationDays * DAY_MS);

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      commitment: makeFallbackCommitment(payload, slug),
    });
  }

  const makerWalletAddress = payload.walletAddress?.trim();
  if (!makerWalletAddress) {
    return NextResponse.json(
      { ok: false, error: "walletAddress is required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.upsert({
    where: { walletAddress: makerWalletAddress },
    create: {
      walletAddress: makerWalletAddress,
      timezone: payload.timezone ?? "UTC",
      notifyTime: payload.notifyTime ?? "09:00",
      worldIdVerified: payload.worldIdVerified ?? false,
    },
    update: {
      timezone: payload.timezone ?? "UTC",
      notifyTime: payload.notifyTime ?? "09:00",
    },
  });

  const commitment = await prisma.commitment.create({
    data: {
      slug,
      title,
      description: payload.description?.trim() || null,
      category: (payload.category ?? "CUSTOM") as CommitmentCategory,
      proofType: (payload.proofType ?? "TEXT") as ProofType,
      coachTone: normalizeCoachTone(payload.coachTone),
      stakeAmountLamports,
      slashDestination: (payload.slashDestination ?? "TREASURY") as SlashDestination,
      startDate,
      endDate,
      totalDays: durationDays,
      requiredProofDays: durationDays,
      status: "ACTIVE",
      isPublic: payload.visibility !== "PRIVATE",
      makerId: user.id,
      proofCount: 0,
      onchainAddress: payload.onchainAddress?.trim() || null,
      onchainTxSig: payload.onchainTxSig?.trim() || null,
    } as unknown as Prisma.CommitmentUncheckedCreateInput,
  });

  return NextResponse.json({
    ok: true,
    commitment: await getCommitmentBySlug(commitment.slug),
  });
}
