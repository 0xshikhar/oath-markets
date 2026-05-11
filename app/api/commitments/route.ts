import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCommitmentBySlug } from "@/lib/oath-data";
import { normalizeCoachTone } from "@/lib/coach-tone";
import { buildPrivateShareUrl, createPrivateShareToken } from "@/lib/private-share";

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

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CommitmentCreateInput;
    const title = payload.title?.trim() || "Untitled oath";
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    const stakeAmountLamports = BigInt(
      Math.round((payload.stakeAmountSol ?? 1) * 1_000_000_000)
    );
    const durationDays = payload.durationDays ?? 30;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * DAY_MS);

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Database is not configured" },
        { status: 503 }
      );
    }

    const makerWalletAddress = payload.walletAddress?.trim();
    if (!makerWalletAddress) {
      return NextResponse.json(
        { ok: false, error: "walletAddress is required" },
        { status: 400 }
      );
    }

    if (!payload.onchainAddress?.trim() || !payload.onchainTxSig?.trim()) {
      return NextResponse.json(
        { ok: false, error: "On-chain transaction is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { walletAddress: makerWalletAddress },
      create: {
        walletAddress: makerWalletAddress,
        timezone: payload.timezone ?? "UTC",
        notifyTime: payload.notifyTime ?? "09:00",
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
        onchainAddress: payload.onchainAddress.trim(),
        onchainTxSig: payload.onchainTxSig.trim(),
      } as unknown as Prisma.CommitmentUncheckedCreateInput,
    });

    const createdCommitment = await getCommitmentBySlug(
      commitment.slug,
      makerWalletAddress
    );
    if (!createdCommitment) {
      throw new Error("Failed to load created commitment");
    }

    const shareUrl = createdCommitment.isPublic
      ? null
      : buildPrivateShareUrl(
        new URL(request.url).origin,
        commitment.slug,
        createPrivateShareToken({
          slug: commitment.slug,
          makerWalletAddress,
        })
      );

    return NextResponse.json({
      ok: true,
      commitment: createdCommitment,
      privateShareUrl: shareUrl,
    });
  } catch (error) {
    console.error("Failed to create commitment", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to create commitment",
      },
      { status: 500 }
    );
  }
}
