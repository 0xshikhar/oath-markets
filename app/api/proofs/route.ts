import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommitmentBySlug } from "@/lib/oath-data";

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

export async function POST(request: Request) {
  const body = (await request.json()) as ProofInput;
  const slug = body.commitmentSlug?.trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: "commitmentSlug is required" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      proof: {
        commitmentSlug: slug,
        dayNumber: body.dayNumber ?? 1,
        coachMessage: `Day ${body.dayNumber ?? 1} logged. Your streak is visible.`,
      },
    });
  }

  const commitment = await prisma.commitment.findUnique({ where: { slug } });
  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  await prisma.proof.create({
    data: {
      commitmentId: commitment.id,
      dayNumber: body.dayNumber ?? Math.max(commitment.proofCount + 1, 1),
      textContent: body.textContent?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
      linkUrl: body.linkUrl?.trim() || null,
      publicNote: body.publicNote?.trim() || null,
      contentHash: body.contentHash?.trim() || null,
      onchainTxSig: body.onchainTxSig?.trim() || null,
    },
  });

  await prisma.commitment.update({
    where: { id: commitment.id },
    data: { proofCount: { increment: 1 } },
  });

  return NextResponse.json({
    ok: true,
    commitment: await getCommitmentBySlug(slug),
    coachMessage: `Day ${body.dayNumber ?? commitment.proofCount + 1} logged. ${commitment.proofCount + 1} proof(s) visible now.`,
  });
}
