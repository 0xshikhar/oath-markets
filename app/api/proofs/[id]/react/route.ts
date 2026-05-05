import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const socialPrisma = prisma as any;

const validTypes = ["MOMENTUM", "STREAK", "WATCHING", "DOUBT"] as const;

type ReactionInput = {
  walletAddress?: string;
  type?: (typeof validTypes)[number];
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
  const reactionDelegate = socialPrisma.reaction as
    | {
        findMany?: typeof socialPrisma.reaction.findMany;
        upsert?: typeof socialPrisma.reaction.upsert;
      }
    | undefined;

  if (!reactionDelegate?.findMany) {
    return {
      counts: emptyCounts(),
      viewerTypes: [],
    };
  }

  const [reactions, viewer] = (await Promise.all([
    reactionDelegate.findMany({
      where: { proofId },
      select: { type: true, userId: true },
    }),
    walletAddress
      ? socialPrisma.user.findUnique({
          where: { walletAddress },
          select: { id: true },
        })
      : Promise.resolve(null),
  ])) as [
    Array<{ type: string; userId: string }>,
    { id: string } | null,
  ];

  return {
    counts: mapCounts(reactions),
    viewerTypes: viewer
      ? reactions.filter((reaction) => reaction.userId === viewer.id).map((reaction) => reaction.type)
      : [],
  };
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

  const proof = await socialPrisma.proof.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!proof) {
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

  const reactionDelegate = socialPrisma.reaction as
    | {
        upsert?: typeof socialPrisma.reaction.upsert;
      }
    | undefined;

  if (!reactionDelegate?.upsert) {
    return NextResponse.json(
      { ok: false, error: "Reaction support is unavailable" },
      { status: 503 }
    );
  }

  const [proof, user] = await Promise.all([
    socialPrisma.proof.findUnique({
      where: { id: proofId },
      select: { id: true },
    }),
    socialPrisma.user.upsert({
      where: { walletAddress },
      create: { walletAddress },
      update: {},
      select: { id: true },
    }),
  ]);

  if (!proof) {
    return NextResponse.json({ ok: false, error: "Proof not found" }, { status: 404 });
  }

  await reactionDelegate.upsert({
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
