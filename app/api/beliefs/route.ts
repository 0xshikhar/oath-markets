import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommitmentBySlug } from "@/lib/oath-data";

type BeliefInput = {
  commitmentSlug?: string;
  walletAddress?: string;
  stakeAmountSol?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as BeliefInput;
  const slug = body.commitmentSlug?.trim();
  const walletAddress = body.walletAddress?.trim();
  if (!slug || !walletAddress) {
    return NextResponse.json(
      { ok: false, error: "commitmentSlug and walletAddress are required" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      belief: {
        commitmentSlug: slug,
        walletAddress,
        stakeAmountSol: body.stakeAmountSol ?? 0.1,
      },
    });
  }

  const commitment = await prisma.commitment.findUnique({ where: { slug } });
  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { walletAddress },
    create: {
      walletAddress,
    },
    update: {},
  });

  await prisma.belief.create({
    data: {
      commitmentId: commitment.id,
      believerId: user.id,
      stakeAmountLamports: BigInt(Math.round((body.stakeAmountSol ?? 0.1) * 1_000_000_000)),
      onchainTxSig: `demo-${Date.now()}`,
    },
  });

  return NextResponse.json({
    ok: true,
    commitment: await getCommitmentBySlug(slug),
  });
}
