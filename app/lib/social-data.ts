import { prisma } from "@/lib/prisma";
import { getExploreCommitments, type CommitmentSummary, type ReactionCounts } from "@/lib/oath-data";

type SocialPrismaClient = typeof prisma & {
  reaction?: NonNullable<typeof prisma.reaction>;
  proof: NonNullable<typeof prisma.proof>;
  commitment: NonNullable<typeof prisma.commitment>;
  user: NonNullable<typeof prisma.user>;
  follow: NonNullable<typeof prisma.follow>;
  belief: NonNullable<typeof prisma.belief>;
};

const socialPrisma = prisma as SocialPrismaClient;

const DAY_MS = 24 * 60 * 60 * 1000;
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

type FeedUserRecord = {
  walletAddress: string;
  username: string | null;
  avatarUrl: string | null;
  worldIdVerified: boolean;
};

type FeedFollowRecord = {
  followingId: string;
  following: FeedUserRecord;
};

type FeedCommitmentRecord = {
  slug: string;
  title: string;
  description: string | null;
  stakeAmountLamports: bigint;
  totalDays: number;
  createdAt: Date;
  maker: FeedUserRecord;
};

type FeedProofRecord = {
  id: string;
  dayNumber: number;
  textContent: string | null;
  publicNote: string | null;
  createdAt: Date;
  commitment: {
    slug: string;
    title: string;
    description: string | null;
    maker: FeedUserRecord;
  };
  reactions: Array<{ type: string }>;
};

type FeedBeliefRecord = {
  stakeAmountLamports: bigint;
  createdAt: Date;
  believer: FeedUserRecord;
  commitment: {
    slug: string;
    title: string;
    description: string | null;
    maker: FeedUserRecord;
  };
};

type FeedResolvedCommitmentRecord = {
  slug: string;
  title: string;
  description: string | null;
  status: string;
  resolvedAt: Date | null;
  createdAt: Date;
  maker: FeedUserRecord;
};

export type HotCommitment = CommitmentSummary & {
  reactionCount24h: number;
};

export type ActivityEvent =
  | {
      id: string;
      type: "NEW_OATH";
      createdAtIso: string;
      actorName: string;
      actorHandle: string;
      actorAvatarUrl: string | null;
      actorVerified: boolean;
      title: string;
      description: string;
      publicUrl: string;
      stakeLabel: string;
      totalDays: number;
    }
  | {
      id: string;
      type: "NEW_PROOF";
      createdAtIso: string;
      actorName: string;
      actorHandle: string;
      actorAvatarUrl: string | null;
      actorVerified: boolean;
      title: string;
      description: string;
      publicUrl: string;
      dayNumber: number;
      excerpt: string;
      proofId: string;
      reactionCounts: ReactionCounts;
    }
  | {
      id: string;
      type: "BELIEVER";
      createdAtIso: string;
      actorName: string;
      actorHandle: string;
      actorAvatarUrl: string | null;
      actorVerified: boolean;
      targetName: string;
      targetHandle: string;
      title: string;
      description: string;
      publicUrl: string;
      stakeLabel: string;
    }
  | {
      id: string;
      type: "RESOLVED";
      createdAtIso: string;
      actorName: string;
      actorHandle: string;
      actorAvatarUrl: string | null;
      actorVerified: boolean;
      title: string;
      description: string;
      publicUrl: string;
      status: "COMPLETED" | "FAILED";
      statusLabel: string;
    };

export type FeedResult = {
  events: ActivityEvent[];
  nextCursor: string | null;
  followingCount: number;
};

function ellipsify(value: string, visible = 4) {
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function formatSol(lamports: bigint) {
  const whole = lamports / 1_000_000_000n;
  const fraction = lamports % 1_000_000_000n;

  if (fraction === 0n) return whole.toString();

  const decimals = fraction.toString().padStart(9, "0").replace(/0+$/, "");
  return decimals ? `${whole}.${decimals.slice(0, 2)}` : whole.toString();
}

function getDisplayName(walletAddress: string, username: string | null) {
  if (username) {
    const name = username.split(".")[0];
    return name
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return ellipsify(walletAddress, 4);
}

function toHandle(walletAddress: string, username: string | null) {
  return username ? `@${username}` : ellipsify(walletAddress, 4);
}

function emptyReactionCounts(): ReactionCounts {
  return {
    momentum: 0,
    streak: 0,
    watching: 0,
    doubt: 0,
    total: 0,
  };
}

function mapReactionCounts(reactions: { type: string }[]): ReactionCounts {
  const counts = emptyReactionCounts();
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

function rankFeedEvent(event: ActivityEvent) {
  const createdAtMs = new Date(event.createdAtIso).getTime();
  const ageHours = Math.max((Date.now() - createdAtMs) / (60 * 60 * 1000), 0);
  const recencyBoost = Math.max(0, 48 - ageHours);

  if (event.type === "NEW_PROOF") {
    return 70 + recencyBoost + event.reactionCounts.total * 6;
  }

  if (event.type === "NEW_OATH") {
    return 55 + recencyBoost;
  }

  if (event.type === "BELIEVER") {
    const stakeScore = Number.parseFloat(event.stakeLabel) || 0;
    return 48 + recencyBoost + Math.min(stakeScore, 20);
  }

  return 60 + recencyBoost;
}

export async function getHotCommitments(limit = 3): Promise<HotCommitment[]> {
  const commitments = await getExploreCommitments({ limit: Math.max(limit, 50) });

  if (!hasDatabaseUrl) {
    return commitments
      .map((commitment) => ({
        ...commitment,
        reactionCount24h: 0,
      }))
      .slice(0, limit);
  }

  const since = new Date(Date.now() - DAY_MS);
  const reactionDelegate = socialPrisma.reaction;

  if (typeof reactionDelegate?.findMany !== "function") {
    return commitments
      .map((commitment) => ({
        ...commitment,
        reactionCount24h: 0,
      }))
      .sort((a, b) => {
        if (b.reactionCount24h !== a.reactionCount24h) {
          return b.reactionCount24h - a.reactionCount24h;
        }
        if (b.believerCount !== a.believerCount) {
          return b.believerCount - a.believerCount;
        }
        return b.progressPercent - a.progressPercent;
      })
      .slice(0, limit);
  }

  const reactions = (await reactionDelegate.findMany({
    where: {
      createdAt: { gte: since },
      proof: {
        commitment: {
          isPublic: true,
        },
      },
    },
    select: {
      proof: {
        select: {
          commitment: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
  })) as Array<{ proof: { commitment: { slug: string } } }>;

  const counts = new Map<string, number>();
  for (const reaction of reactions) {
    const slug = reaction.proof.commitment.slug;
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  return commitments
    .map((commitment) => ({
      ...commitment,
      reactionCount24h: counts.get(commitment.slug) ?? 0,
    }))
    .sort((a, b) => {
      if (b.reactionCount24h !== a.reactionCount24h) {
        return b.reactionCount24h - a.reactionCount24h;
      }
      if (b.believerCount !== a.believerCount) {
        return b.believerCount - a.believerCount;
      }
      return b.progressPercent - a.progressPercent;
    })
    .slice(0, limit);
}

export async function getFeedEvents(
  walletAddress: string,
  options: { limit?: number; cursor?: string | null } = {}
): Promise<FeedResult> {
  const limit = options.limit ?? 20;
  const fetchLimit = Math.max(limit * 3, 30);
  const before = options.cursor ? new Date(options.cursor) : null;

  if (!hasDatabaseUrl) {
    return {
      events: [],
      nextCursor: null,
      followingCount: 0,
    };
  }

  const viewer = await socialPrisma.user.findUnique({
    where: { walletAddress },
    select: { id: true },
  });

  if (!viewer) {
    return {
      events: [],
      nextCursor: null,
      followingCount: 0,
    };
  }

  const followDelegate = socialPrisma.follow;

  if (typeof followDelegate.findMany !== "function") {
    return {
      events: [],
      nextCursor: null,
      followingCount: 0,
    };
  }

  const follows = (await followDelegate.findMany({
    where: { followerId: viewer.id },
    select: {
      followingId: true,
      following: {
        select: {
          walletAddress: true,
          username: true,
          avatarUrl: true,
          worldIdVerified: true,
        },
      },
    },
  })) as FeedFollowRecord[];

  const followingIds = follows.map((entry) => entry.followingId);
  if (followingIds.length === 0) {
    return {
      events: [],
      nextCursor: null,
      followingCount: 0,
    };
  }

  const dateFilter = before ? { lt: before } : undefined;

  const [commitments, proofs, beliefs, resolvedCommitments] = (await Promise.all([
    socialPrisma.commitment.findMany({
      where: {
        makerId: { in: followingIds },
        isPublic: true,
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: {
        slug: true,
        title: true,
        description: true,
        stakeAmountLamports: true,
        totalDays: true,
        createdAt: true,
        maker: {
          select: {
            walletAddress: true,
            username: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
      },
    }),
    socialPrisma.proof.findMany({
      where: {
        commitment: {
          makerId: { in: followingIds },
          isPublic: true,
        },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: {
        id: true,
        dayNumber: true,
        textContent: true,
        publicNote: true,
        createdAt: true,
        commitment: {
          select: {
            slug: true,
            title: true,
            description: true,
            maker: {
              select: {
                walletAddress: true,
                username: true,
                avatarUrl: true,
                worldIdVerified: true,
              },
            },
          },
        },
        reactions: {
          select: {
            type: true,
          },
        },
      },
    }),
    socialPrisma.belief.findMany({
      where: {
        commitment: {
          makerId: { in: followingIds },
          isPublic: true,
        },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: {
        stakeAmountLamports: true,
        createdAt: true,
        believer: {
          select: {
            walletAddress: true,
            username: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
        commitment: {
          select: {
            slug: true,
            title: true,
            description: true,
            maker: {
              select: {
                walletAddress: true,
                username: true,
                avatarUrl: true,
                worldIdVerified: true,
              },
            },
          },
        },
      },
    }),
    socialPrisma.commitment.findMany({
      where: {
        makerId: { in: followingIds },
        status: { in: ["COMPLETED", "FAILED"] },
        resolvedAt: { not: null },
        ...(dateFilter ? { resolvedAt: dateFilter } : {}),
      },
      orderBy: { resolvedAt: "desc" },
      take: fetchLimit,
      select: {
        slug: true,
        title: true,
        description: true,
        status: true,
        resolvedAt: true,
        createdAt: true,
        maker: {
          select: {
            walletAddress: true,
            username: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
      },
    }),
  ])) as [
    FeedCommitmentRecord[],
    FeedProofRecord[],
    FeedBeliefRecord[],
    FeedResolvedCommitmentRecord[],
  ];

  const events: ActivityEvent[] = [
    ...commitments.map((commitment) => ({
      id: `commitment:${commitment.slug}:${commitment.createdAt.toISOString()}`,
      type: "NEW_OATH" as const,
      createdAtIso: commitment.createdAt.toISOString(),
      actorName: getDisplayName(
        commitment.maker.walletAddress,
        commitment.maker.username
      ),
      actorHandle: toHandle(
        commitment.maker.walletAddress,
        commitment.maker.username
      ),
      actorAvatarUrl: commitment.maker.avatarUrl,
      actorVerified: commitment.maker.worldIdVerified,
      title: commitment.title,
      description: commitment.description ?? "",
      publicUrl: `/c/${commitment.slug}`,
      stakeLabel: `${formatSol(commitment.stakeAmountLamports)} SOL`,
      totalDays: commitment.totalDays,
    })),
    ...proofs.map((proof) => ({
      id: `proof:${proof.id}`,
      type: "NEW_PROOF" as const,
      createdAtIso: proof.createdAt.toISOString(),
      actorName: getDisplayName(
        proof.commitment.maker.walletAddress,
        proof.commitment.maker.username
      ),
      actorHandle: toHandle(
        proof.commitment.maker.walletAddress,
        proof.commitment.maker.username
      ),
      actorAvatarUrl: proof.commitment.maker.avatarUrl,
      actorVerified: proof.commitment.maker.worldIdVerified,
      title: proof.commitment.title,
      description: proof.commitment.description ?? "",
      publicUrl: `/c/${proof.commitment.slug}`,
      dayNumber: proof.dayNumber,
      excerpt: proof.textContent ?? proof.publicNote ?? "Proof posted.",
      proofId: proof.id,
      reactionCounts: mapReactionCounts(proof.reactions),
    })),
    ...beliefs.map((belief) => ({
      id: `belief:${belief.createdAt.toISOString()}:${belief.commitment.slug}`,
      type: "BELIEVER" as const,
      createdAtIso: belief.createdAt.toISOString(),
      actorName: getDisplayName(
        belief.believer.walletAddress,
        belief.believer.username
      ),
      actorHandle: toHandle(
        belief.believer.walletAddress,
        belief.believer.username
      ),
      actorAvatarUrl: belief.believer.avatarUrl,
      actorVerified: belief.believer.worldIdVerified,
      targetName: getDisplayName(
        belief.commitment.maker.walletAddress,
        belief.commitment.maker.username
      ),
      targetHandle: toHandle(
        belief.commitment.maker.walletAddress,
        belief.commitment.maker.username
      ),
      title: belief.commitment.title,
      description: belief.commitment.description ?? "",
      publicUrl: `/c/${belief.commitment.slug}`,
      stakeLabel: `${formatSol(belief.stakeAmountLamports)} SOL`,
    })),
    ...resolvedCommitments.map((commitment) => {
      const createdAt = commitment.resolvedAt ?? commitment.createdAt;
      return {
        id: `resolved:${commitment.slug}:${createdAt.toISOString()}`,
        type: "RESOLVED" as const,
        createdAtIso: createdAt.toISOString(),
        actorName: getDisplayName(
          commitment.maker.walletAddress,
          commitment.maker.username
        ),
        actorHandle: toHandle(
          commitment.maker.walletAddress,
          commitment.maker.username
        ),
        actorAvatarUrl: commitment.maker.avatarUrl,
        actorVerified: commitment.maker.worldIdVerified,
        title: commitment.title,
        description: commitment.description ?? "",
        publicUrl: `/c/${commitment.slug}`,
        status: commitment.status as "COMPLETED" | "FAILED",
        statusLabel: commitment.status === "COMPLETED" ? "Completed" : "Failed",
      };
    }),
  ].sort((a, b) => {
    const scoreDelta = rankFeedEvent(b) - rankFeedEvent(a);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    const timeDelta = new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime();
    if (timeDelta !== 0) {
      return timeDelta;
    }

    return a.id.localeCompare(b.id);
  });

  const sliced = events.slice(0, limit);

  return {
    events: sliced,
    nextCursor: sliced.length === limit ? sliced[sliced.length - 1]?.createdAtIso ?? null : null,
    followingCount: follows.length,
  };
}
