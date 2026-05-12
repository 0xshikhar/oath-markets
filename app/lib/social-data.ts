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
  name: string | null;
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
      type: "FOLLOW";
      createdAtIso: string;
      actorName: string;
      actorHandle: string;
      actorAvatarUrl: string | null;
      actorVerified: boolean;
      targetName: string;
      targetHandle: string;
      publicUrl: string;
    }
  | {
      id: string;
      type: "CHALLENGE";
      createdAtIso: string;
      actorName: string;
      actorHandle: string;
      actorAvatarUrl: string | null;
      actorVerified: boolean;
      targetName: string;
      targetHandle: string;
      goal: string;
      stakeLabel: string;
      publicUrl: string;
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

function getDisplayName(walletAddress: string, username: string | null, name?: string | null) {
  if (name) return name;
  if (username) {
    const handleName = username.split(".")[0];
    return handleName
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
  options: { limit?: number; cursor?: string | null; sort?: "latest" | "trending" } = {}
): Promise<FeedResult> {
  const limit = options.limit ?? 20;
  const sort = options.sort ?? "latest";
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

  const PromiseResult = (await Promise.all([
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
            name: true,
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
            name: true,
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
            name: true,
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
            name: true,
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
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
      },
    }),
    socialPrisma.follow.findMany({
      where: {
        followerId: { in: followingIds },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: {
        id: true,
        createdAt: true,
        follower: {
          select: {
            walletAddress: true,
            username: true,
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
        following: {
          select: {
            walletAddress: true,
            username: true,
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
      },
    }),
    socialPrisma.challenge.findMany({
      where: {
        challengerId: { in: followingIds },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: {
        id: true,
        goal: true,
        stakeSol: true,
        token: true,
        createdAt: true,
        challenger: {
          select: {
            walletAddress: true,
            username: true,
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
        challenged: {
          select: {
            walletAddress: true,
            username: true,
            name: true,
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
    any[],
    any[],
  ];

  const [commitments, proofs, beliefs, resolvedCommitments] = PromiseResult;

  const followsEvents = (PromiseResult[4] ?? []).map((f: any) => ({
    id: `follow:${f.id}`,
    type: "FOLLOW" as const,
    createdAtIso: f.createdAt.toISOString(),
    actorName: getDisplayName(f.follower.walletAddress, f.follower.username, f.follower.name),
    actorHandle: toHandle(f.follower.walletAddress, f.follower.username),
    actorAvatarUrl: f.follower.avatarUrl,
    actorVerified: f.follower.worldIdVerified,
    targetName: getDisplayName(f.following.walletAddress, f.following.username, f.following.name),
    targetHandle: toHandle(f.following.walletAddress, f.following.username),
    publicUrl: `/u/${f.following.walletAddress}`,
  }));

  const challengesEvents = (PromiseResult[5] ?? []).map((c: any) => ({
    id: `challenge:${c.id}`,
    type: "CHALLENGE" as const,
    createdAtIso: c.createdAt.toISOString(),
    actorName: getDisplayName(c.challenger.walletAddress, c.challenger.username, c.challenger.name),
    actorHandle: toHandle(c.challenger.walletAddress, c.challenger.username),
    actorAvatarUrl: c.challenger.avatarUrl,
    actorVerified: c.challenger.worldIdVerified,
    targetName: getDisplayName(c.challenged.walletAddress, c.challenged.username, c.challenged.name),
    targetHandle: toHandle(c.challenged.walletAddress, c.challenged.username),
    goal: c.goal,
    stakeLabel: `${c.stakeSol} SOL`,
    publicUrl: `/challenge/${c.token}`,
  }));

  const events: ActivityEvent[] = [
    ...commitments.map((commitment) => ({
      id: `commitment:${commitment.slug}:${commitment.createdAt.toISOString()}`,
      type: "NEW_OATH" as const,
      createdAtIso: commitment.createdAt.toISOString(),
      actorName: getDisplayName(
        commitment.maker.walletAddress,
        commitment.maker.username,
        commitment.maker.name
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
        proof.commitment.maker.username,
        proof.commitment.maker.name
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
        belief.believer.username,
        belief.believer.name
      ),
      actorHandle: toHandle(
        belief.believer.walletAddress,
        belief.believer.username
      ),
      actorAvatarUrl: belief.believer.avatarUrl,
      actorVerified: belief.believer.worldIdVerified,
      targetName: getDisplayName(
        belief.commitment.maker.walletAddress,
        belief.commitment.maker.username,
        belief.commitment.maker.name
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
          commitment.maker.username,
          commitment.maker.name
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
    ...followsEvents,
    ...challengesEvents,
  ].sort((a, b) => {
    if (sort === "trending") {
      const scoreDelta = rankFeedEvent(b) - rankFeedEvent(a);
      if (scoreDelta !== 0) return scoreDelta;
    }

    const timeDelta = new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime();
    if (timeDelta !== 0) return timeDelta;

    return a.id.localeCompare(b.id);
  });

  const sliced = events.slice(0, limit);

  return {
    events: sliced,
    nextCursor: sliced.length === limit ? sliced[sliced.length - 1]?.createdAtIso ?? null : null,
    followingCount: follows.length,
  };
}
export async function getGlobalActivity(limit = 10): Promise<ActivityEvent[]> {
  if (!hasDatabaseUrl) return [];

  const [commitments, proofs, beliefs] = await Promise.all([
    socialPrisma.commitment.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: limit,
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
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
      },
    }),
    socialPrisma.proof.findMany({
      where: { commitment: { isPublic: true } },
      orderBy: { createdAt: "desc" },
      take: limit,
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
            maker: {
              select: {
                walletAddress: true,
                username: true,
            name: true,
                avatarUrl: true,
                worldIdVerified: true,
              },
            },
          },
        },
        reactions: {
          select: { type: true },
        },
      },
    }),
    socialPrisma.belief.findMany({
      where: { commitment: { isPublic: true } },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        stakeAmountLamports: true,
        createdAt: true,
        believer: {
          select: {
            walletAddress: true,
            username: true,
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
        commitment: {
          select: {
            slug: true,
            title: true,
            maker: {
              select: {
                walletAddress: true,
                username: true,
            name: true,
                avatarUrl: true,
                worldIdVerified: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const events: ActivityEvent[] = [
    ...commitments.map((c) => ({
      id: `c:${c.slug}`,
      type: "NEW_OATH" as const,
      createdAtIso: c.createdAt.toISOString(),
      actorName: getDisplayName(c.maker.walletAddress, c.maker.username, c.maker.name),
      actorHandle: toHandle(c.maker.walletAddress, c.maker.username),
      actorAvatarUrl: c.maker.avatarUrl,
      actorVerified: c.maker.worldIdVerified,
      title: c.title,
      description: c.description ?? "",
      publicUrl: `/c/${c.slug}`,
      stakeLabel: `${formatSol(c.stakeAmountLamports)} SOL`,
      totalDays: c.totalDays,
    })),
    ...proofs.map((p) => ({
      id: `p:${p.id}`,
      type: "NEW_PROOF" as const,
      createdAtIso: p.createdAt.toISOString(),
      actorName: getDisplayName(p.commitment.maker.walletAddress, p.commitment.maker.username, p.commitment.maker.name),
      actorHandle: toHandle(p.commitment.maker.walletAddress, p.commitment.maker.username),
      actorAvatarUrl: p.commitment.maker.avatarUrl,
      actorVerified: p.commitment.maker.worldIdVerified,
      title: p.commitment.title,
      description: "",
      publicUrl: `/c/${p.commitment.slug}`,
      dayNumber: p.dayNumber,
      excerpt: p.textContent ?? p.publicNote ?? "Proof posted.",
      proofId: p.id,
      reactionCounts: mapReactionCounts(p.reactions),
    })),
    ...beliefs.map((b) => ({
      id: `b:${b.createdAt.toISOString()}`,
      type: "BELIEVER" as const,
      createdAtIso: b.createdAt.toISOString(),
      actorName: getDisplayName(b.believer.walletAddress, b.believer.username),
      actorHandle: toHandle(b.believer.walletAddress, b.believer.username),
      actorAvatarUrl: b.believer.avatarUrl,
      actorVerified: b.believer.worldIdVerified,
      targetName: getDisplayName(b.commitment.maker.walletAddress, b.commitment.maker.username, b.commitment.maker.name),
      targetHandle: toHandle(b.commitment.maker.walletAddress, b.commitment.maker.username),
      title: b.commitment.title,
      description: "",
      publicUrl: `/c/${b.commitment.slug}`,
      stakeLabel: `${formatSol(b.stakeAmountLamports)} SOL`,
    })),
  ].sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime());

  return events.slice(0, limit);
}

export type SocialPulseResult = {
  notifications: Array<{
    id: string;
    type: "FOLLOW" | "BELIEVER" | "CHEER";
    createdAtIso: string;
    actorName: string;
    actorHandle: string;
    actorAvatarUrl: string | null;
    actorVerified: boolean;
    title: string;
    publicUrl: string;
  }>;
  believerInsights: Array<{
    walletAddress: string;
    handle: string;
    avatarUrl: string | null;
    reputationScore: string;
    totalStakedLabel: string;
    beliefCount: number;
  }>;
  totalReactionsReceived: number;
};

export async function getSocialPulse(walletAddress: string): Promise<SocialPulseResult> {
  if (!hasDatabaseUrl) {
    return { notifications: [], believerInsights: [], totalReactionsReceived: 0 };
  }

  const user = await socialPrisma.user.findUnique({
    where: { walletAddress },
    select: { id: true },
  });

  if (!user) return { notifications: [], believerInsights: [], totalReactionsReceived: 0 };

  const [followers, beliefs, cheers, totalReactionsReceived] = await Promise.all([
    socialPrisma.follow.findMany({
      where: { followingId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        follower: {
          select: {
            walletAddress: true,
            username: true,
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
      },
    }),
    socialPrisma.belief.findMany({
      where: {
        commitment: { makerId: user.id },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        believer: {
          select: {
            walletAddress: true,
            username: true,
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
        commitment: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    }),
    socialPrisma.cheer.findMany({
      where: {
        commitment: { makerId: user.id },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        author: {
          select: {
            walletAddress: true,
            username: true,
            name: true,
            avatarUrl: true,
            worldIdVerified: true,
          },
        },
        commitment: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
    }),
    socialPrisma.reaction.count({
      where: {
        proof: {
          commitment: {
            makerId: user.id,
          },
        },
      },
    }),
  ]);

  const notifications = [
    ...followers.map((f) => ({
      id: `f:${f.id}`,
      type: "FOLLOW" as const,
      createdAtIso: f.createdAt.toISOString(),
      actorName: getDisplayName(f.follower.walletAddress, f.follower.username, f.follower.name),
      actorHandle: toHandle(f.follower.walletAddress, f.follower.username),
      actorAvatarUrl: f.follower.avatarUrl,
      actorVerified: f.follower.worldIdVerified,
      title: "followed you",
      publicUrl: `/u/${f.follower.walletAddress}`,
    })),
    ...beliefs.map((b) => ({
      id: `b:${b.id}`,
      type: "BELIEVER" as const,
      createdAtIso: b.createdAt.toISOString(),
      actorName: getDisplayName(b.believer.walletAddress, b.believer.username),
      actorHandle: toHandle(b.believer.walletAddress, b.believer.username),
      actorAvatarUrl: b.believer.avatarUrl,
      actorVerified: b.believer.worldIdVerified,
      title: `believed in ${b.commitment.title}`,
      publicUrl: `/c/${b.commitment.slug}`,
    })),
    ...cheers.map((c) => ({
      id: `c:${c.id}`,
      type: "CHEER" as const,
      createdAtIso: c.createdAt.toISOString(),
      actorName: getDisplayName(c.author.walletAddress, c.author.username, c.author.name),
      actorHandle: toHandle(c.author.walletAddress, c.author.username),
      actorAvatarUrl: c.author.avatarUrl,
      actorVerified: c.author.worldIdVerified,
      title: `cheered for ${c.commitment.title}: "${c.message}"`,
      publicUrl: `/c/${c.commitment.slug}`,
    })),
  ].sort((a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime());

  // Aggregate believer insights
  const allBeliefs = await socialPrisma.belief.findMany({
    where: { commitment: { makerId: user.id } },
    include: {
      believer: {
        select: {
          walletAddress: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  const believerMap = new Map<string, {
    walletAddress: string;
    handle: string;
    avatarUrl: string | null;
    totalStaked: bigint;
    count: number;
  }>();

  for (const b of allBeliefs) {
    const key = b.believer.walletAddress;
    const existing = believerMap.get(key) ?? {
      walletAddress: key,
      handle: toHandle(b.believer.walletAddress, b.believer.username),
      avatarUrl: b.believer.avatarUrl,
      totalStaked: 0n,
      count: 0,
    };
    existing.totalStaked += b.stakeAmountLamports;
    existing.count += 1;
    believerMap.set(key, existing);
  }

  const believerInsights = Array.from(believerMap.values())
    .sort((a, b) => Number(b.totalStaked - a.totalStaked))
    .slice(0, 5)
    .map((bi) => ({
      walletAddress: bi.walletAddress,
      handle: bi.handle,
      avatarUrl: bi.avatarUrl,
      reputationScore: "High", // Placeholder
      totalStakedLabel: `${formatSol(bi.totalStaked)} SOL`,
      beliefCount: bi.count,
    }));

  return { notifications, believerInsights, totalReactionsReceived };
}
