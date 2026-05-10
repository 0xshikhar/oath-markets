import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCommitmentBySlug } from "@/lib/oath-data";
import { canWriteCommitment } from "@/lib/oath-access";
import { verifyPrivateShareToken } from "@/lib/private-share";

type BeliefInput = {
  commitmentSlug?: string;
  walletAddress?: string;
  stakeAmountSol?: number;
  onchainAddress?: string;
  onchainTxSig?: string;
  accessToken?: string;
};

type BeliefAccessRecord = {
  id: string;
  isPublic: boolean;
  maker: {
    walletAddress: string;
  };
};

export async function POST(request: Request) {
  const body = (await request.json()) as BeliefInput;
  const slug = body.commitmentSlug?.trim();
  const walletAddress = body.walletAddress?.trim();
  const accessToken = body.accessToken?.trim();
  if (!slug || !walletAddress) {
    return NextResponse.json(
      { ok: false, error: "commitmentSlug and walletAddress are required" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  if (!body.onchainAddress?.trim() || !body.onchainTxSig?.trim()) {
    return NextResponse.json(
      { ok: false, error: "On-chain transaction is required" },
      { status: 400 }
    );
  }

  const commitment = (await prisma.commitment.findUnique({
    where: { slug },
    select: {
      id: true,
      isPublic: true,
      maker: {
        select: {
          walletAddress: true,
        },
      },
    },
  })) as BeliefAccessRecord | null;
  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  if (
    !canWriteCommitment(
      {
        isPublic: commitment.isPublic,
        makerWalletAddress: commitment.maker.walletAddress,
      },
      walletAddress,
      Boolean(
        accessToken &&
          verifyPrivateShareToken(accessToken, {
            slug,
            makerWalletAddress: commitment.maker.walletAddress,
          })
      )
    )
  ) {
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
      onchainAddress: body.onchainAddress.trim(),
      onchainTxSig: body.onchainTxSig.trim(),
    },
  });

  const updatedCommitment = await getCommitmentBySlug(slug, walletAddress);
  if (!updatedCommitment) {
    return NextResponse.json(
      { ok: false, error: "Failed to load updated commitment" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    commitment: updatedCommitment,
  });
}
