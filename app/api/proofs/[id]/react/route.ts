import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canViewCommitment } from "@/lib/oath-access";

type SocialPrismaClient = typeof prisma & {
  reaction: NonNullable<typeof prisma.reaction> & {
    deleteMany: (...args: unknown[]) => Promise<unknown>;
  };
  proof: NonNullable<typeof prisma.proof>;
  user: NonNullable<typeof prisma.user>;
};

const socialPrisma = prisma as SocialPrismaClient;

const validTypes = ["MOMENTUM", "STREAK", "WATCHING", "DOUBT"] as const;
type ReactionType = (typeof validTypes)[number];

type ReactionInput = {
  walletAddress?: string;
  type?: ReactionType;
};

type ProofAccessRecord = {
  id: string;
  commitment: {
    slug: string;
    isPublic: boolean;
    maker: {
      walletAddress: string;
    };
  };
};

type ReactionRow = {
  type: ReactionType;
  userId: string;
};

function emptyCounts() {
  return {
    momentum: 0,
    streak: 0,
    watching: 0,
    doubt: 0,
    total: 0,
  };
}

function mapCounts(reactions: { type: string }[]) {
  const counts = emptyCounts();
  for (const reaction of reactions) {
    const type = reaction.type.toLowerCase();
    if (type === "momentum") counts.momentum += 1;
    if (type === "streak") counts.streak += 1;
    if (type === "watching") counts.watching += 1;
    if (type === "doubt") counts.doubt += 1;
    counts.total += 1;
  }
  return counts;
}

async function loadReactionState(proofId: string, walletAddress?: string) {
  if (typeof socialPrisma.reaction.findMany !== "function") {
    return {
      counts: emptyCounts(),
      viewerTypes: [] as ReactionType[],
    };
  }

  const [reactions, viewer] = (await Promise.all([
    socialPrisma.reaction.findMany({
      where: { proofId },
      select: { type: true, userId: true },
    }),
    walletAddress
      ? socialPrisma.user.findUnique({
          where: { walletAddress },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])) as [ReactionRow[], { id: string } | null];

  return {
    counts: mapCounts(reactions),
    viewerTypes: viewer
      ? reactions.filter((reaction) => reaction.userId === viewer.id).map((reaction) => reaction.type)
      : ([] as ReactionType[]),
  };
}

async function loadProofAccess(proofId: string): Promise<ProofAccessRecord | null> {
  const proof = (await socialPrisma.proof.findUnique({
    where: { id: proofId },
    select: {
      id: true,
      commitment: {
        select: {
          slug: true,
          isPublic: true,
          maker: {
            select: {
              walletAddress: true,
            },
          },
        },
      },
    },
  })) as ProofAccessRecord | null;

  return proof;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("walletAddress")?.trim() ?? undefined;

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      counts: emptyCounts(),
      viewerTypes: [],
    });
  }

  const proof = await loadProofAccess(id);

  if (
    !proof ||
    !canViewCommitment(
      {
        isPublic: proof.commitment.isPublic,
        makerWalletAddress: proof.commitment.maker.walletAddress,
      },
      walletAddress
    )
  ) {
    return NextResponse.json({ ok: false, error: "Proof not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    ...(await loadReactionState(id, walletAddress)),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proofId } = await params;
  const body = (await request.json()) as ReactionInput;
  const walletAddress = body.walletAddress?.trim();
  const type = body.type;

  if (!walletAddress || !type) {
    return NextResponse.json(
      { ok: false, error: "walletAddress and type are required" },
      { status: 400 }
    );
  }

  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { ok: false, error: "Invalid reaction type" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      counts: emptyCounts(),
      viewerTypes: [type],
    });
  }

  if (typeof socialPrisma.reaction.upsert !== "function") {
    return NextResponse.json(
      { ok: false, error: "Reaction support is unavailable" },
      { status: 503 }
    );
  }

  const proof = await loadProofAccess(proofId);

  if (
    !proof ||
    !canViewCommitment(
      {
        isPublic: proof.commitment.isPublic,
        makerWalletAddress: proof.commitment.maker.walletAddress,
      },
      walletAddress
    )
  ) {
    return NextResponse.json({ ok: false, error: "Proof not found" }, { status: 404 });
  }

  const user = await socialPrisma.user.upsert({
    where: { walletAddress },
    create: { walletAddress },
    update: {},
    select: { id: true },
  });

  await socialPrisma.reaction.upsert({
    where: {
      proofId_userId_type: {
        proofId,
        userId: user.id,
        type,
      },
    },
    update: {},
    create: {
      proofId,
      userId: user.id,
      type,
    },
  });

  return NextResponse.json({
    ok: true,
    ...(await loadReactionState(proofId, walletAddress)),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proofId } = await params;
  const body = (await request.json()) as ReactionInput;
  const walletAddress = body.walletAddress?.trim();
  const type = body.type;

  if (!walletAddress || !type) {
    return NextResponse.json(
      { ok: false, error: "walletAddress and type are required" },
      { status: 400 }
    );
  }

  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { ok: false, error: "Invalid reaction type" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({
      ok: true,
      counts: emptyCounts(),
      viewerTypes: [],
    });
  }

  if (typeof socialPrisma.reaction.deleteMany !== "function") {
    return NextResponse.json(
      { ok: false, error: "Reaction support is unavailable" },
      { status: 503 }
    );
  }

  const proof = await loadProofAccess(proofId);

  if (
    !proof ||
    !canViewCommitment(
      {
        isPublic: proof.commitment.isPublic,
        makerWalletAddress: proof.commitment.maker.walletAddress,
      },
      walletAddress
    )
  ) {
    return NextResponse.json({ ok: false, error: "Proof not found" }, { status: 404 });
  }

  const user = await socialPrisma.user.upsert({
    where: { walletAddress },
    create: { walletAddress },
    update: {},
    select: { id: true },
  });

  await socialPrisma.reaction.deleteMany({
    where: {
      proofId,
      userId: user.id,
      type,
    },
  });

  return NextResponse.json({
    ok: true,
    ...(await loadReactionState(proofId, walletAddress)),
  });
}
