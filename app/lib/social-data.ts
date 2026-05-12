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
    if (type === "momentum") counts.momentum++;
    else if (type === "streak") counts.streak++;
    else if (type === "watching") counts.watching++;
    else if (type === "doubt") counts.doubt++;
  }
  counts.total = reactions.length;
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
  const cursor = options.cursor;
  const sort = options.sort ?? "latest";

  if (!hasDatabaseUrl) {
    return { events: [], nextCursor: null, followingCount: 0 };
  }

  try {
    const user = await socialPrisma.user.findUnique({
      where: { walletAddress },
      include: {
        following: {
          select: {
            followingId: true,
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
        },
      },
    });

    if (!user) {
      return { events: [], nextCursor: null, followingCount: 0 };
    }

    const followingIds = user.following.map((f) => f.followingId);
    followingIds.push(user.id); // Include self

    const [proofs, commitments, beliefs, follows, challenges, resolved] = await Promise.all([
      socialPrisma.proof.findMany({
        where: { commitment: { makerId: { in: followingIds } } },
        orderBy: { createdAt: "desc" },
        take: limit * 2,
        include: {
          commitment: { include: { maker: true } },
          reactions: { select: { type: true } },
        },
      }),
      socialPrisma.commitment.findMany({
        where: { makerId: { in: followingIds } },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { maker: true },
      }),
      socialPrisma.belief.findMany({
        where: { believerId: { in: followingIds } },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { believer: true, commitment: { include: { maker: true } } },
      }),
      socialPrisma.follow.findMany({
        where: { followerId: { in: followingIds } },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { following: true },
      }),
      socialPrisma.challenge.findMany({
        where: { challengerId: { in: followingIds } },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { challenger: true, challenged: true },
      }),
      socialPrisma.commitment.findMany({
        where: { makerId: { in: followingIds }, status: { in: ["COMPLETED", "FAILED"] } },
        orderBy: { resolvedAt: "desc" },
        take: limit,
        include: { maker: true },
      }),
    ]);

    const events: ActivityEvent[] = [];

    // Map proofs
    for (const p of proofs) {
      events.push({
        id: `proof-${p.id}`,
        type: "NEW_PROOF",
        createdAtIso: p.createdAt.toISOString(),
        actorName: getDisplayName(p.commitment.maker.walletAddress, p.commitment.maker.username, p.commitment.maker.name),
        actorHandle: toHandle(p.commitment.maker.walletAddress, p.commitment.maker.username),
        actorAvatarUrl: p.commitment.maker.avatarUrl,
        actorVerified: p.commitment.maker.worldIdVerified,
        title: p.commitment.title,
        description: p.commitment.description ?? "",
        publicUrl: `/c/${p.commitment.slug}`,
        dayNumber: p.dayNumber,
        excerpt: p.textContent ?? "Submitting proof...",
        proofId: p.id,
        reactionCounts: mapReactionCounts(p.reactions),
      });
    }

    // Map new oaths
    for (const c of commitments) {
      events.push({
        id: `oath-${c.id}`,
        type: "NEW_OATH",
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
      });
    }

    // Map beliefs
    for (const b of beliefs) {
      events.push({
        id: `belief-${b.id}`,
        type: "BELIEVER",
        createdAtIso: b.createdAt.toISOString(),
        actorName: getDisplayName(b.believer.walletAddress, b.believer.username, b.believer.name),
        actorHandle: toHandle(b.believer.walletAddress, b.believer.username),
        actorAvatarUrl: b.believer.avatarUrl,
        actorVerified: b.believer.worldIdVerified,
        targetName: getDisplayName(b.commitment.maker.walletAddress, b.commitment.maker.username, b.commitment.maker.name),
        targetHandle: toHandle(b.commitment.maker.walletAddress, b.commitment.maker.username),
        title: b.commitment.title,
        description: b.commitment.description ?? "",
        publicUrl: `/c/${b.commitment.slug}`,
        stakeLabel: `${formatSol(b.stakeAmountLamports)} SOL`,
      });
    }

    // Map follows
    for (const f of follows) {
      events.push({
        id: `follow-${f.id}`,
        type: "FOLLOW",
        createdAtIso: f.createdAt.toISOString(),
        actorName: getDisplayName(user.walletAddress, user.username, user.name),
        actorHandle: toHandle(user.walletAddress, user.username),
        actorAvatarUrl: user.avatarUrl,
        actorVerified: user.worldIdVerified,
        targetName: getDisplayName(f.following.walletAddress, f.following.username, f.following.name),
        targetHandle: toHandle(f.following.walletAddress, f.following.username),
        publicUrl: `/u/${f.following.walletAddress}`,
      });
    }

    // Map challenges
    for (const ch of challenges) {
      events.push({
        id: `challenge-${ch.id}`,
        type: "CHALLENGE",
        createdAtIso: ch.createdAt.toISOString(),
        actorName: getDisplayName(ch.challenger.walletAddress, ch.challenger.username, ch.challenger.name),
        actorHandle: toHandle(ch.challenger.walletAddress, ch.challenger.username),
        actorAvatarUrl: ch.challenger.avatarUrl,
        actorVerified: ch.challenger.worldIdVerified,
        targetName: getDisplayName(ch.challenged.walletAddress, ch.challenged.username, ch.challenged.name),
        targetHandle: toHandle(ch.challenged.walletAddress, ch.challenged.username),
        goal: ch.goal,
        stakeLabel: `${ch.stakeSol} SOL`,
        publicUrl: `/u/${ch.challenged.walletAddress}`,
      });
    }

    // Map resolved
    for (const r of resolved) {
      events.push({
        id: `resolved-${r.id}`,
        type: "RESOLVED",
        createdAtIso: r.resolvedAt?.toISOString() ?? r.createdAt.toISOString(),
        actorName: getDisplayName(r.maker.walletAddress, r.maker.username, r.maker.name),
        actorHandle: toHandle(r.maker.walletAddress, r.maker.username),
        actorAvatarUrl: r.maker.avatarUrl,
        actorVerified: r.maker.worldIdVerified,
        title: r.title,
        description: r.description ?? "",
        publicUrl: `/c/${r.slug}`,
        status: r.status as "COMPLETED" | "FAILED",
        statusLabel: r.status === "COMPLETED" ? "SUCCESS" : "FAILED",
      });
    }

    const sortedEvents = events.sort((a, b) => {
      if (sort === "trending") {
        return rankFeedEvent(b) - rankFeedEvent(a);
      }
      return new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime();
    });

    const paginated = sortedEvents.slice(0, limit);

    return {
      events: paginated,
      nextCursor: paginated.length === limit ? paginated[paginated.length - 1].id : null,
      followingCount: user.following.length,
    };
  } catch (error) {
    console.error("Failed to load feed events", error);
    return { events: [], nextCursor: null, followingCount: 0 };
  }
}

export async function getGlobalActivity(limit = 10): Promise<ActivityEvent[]> {
  if (!hasDatabaseUrl) return [];

  try {
    const proofs = await socialPrisma.proof.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        commitment: { include: { maker: true } },
        reactions: { select: { type: true } },
      },
    });

    return proofs.map((p) => ({
      id: `proof-${p.id}`,
      type: "NEW_PROOF",
      createdAtIso: p.createdAt.toISOString(),
      actorName: getDisplayName(p.commitment.maker.walletAddress, p.commitment.maker.username, p.commitment.maker.name),
      actorHandle: toHandle(p.commitment.maker.walletAddress, p.commitment.maker.username),
      actorAvatarUrl: p.commitment.maker.avatarUrl,
      actorVerified: p.commitment.maker.worldIdVerified,
      title: p.commitment.title,
      description: p.commitment.description ?? "",
      publicUrl: `/c/${p.commitment.slug}`,
      dayNumber: p.dayNumber,
      excerpt: p.textContent ?? "Submitting proof...",
      proofId: p.id,
      reactionCounts: mapReactionCounts(p.reactions),
    }));
  } catch (error) {
    console.error("Failed to load global activity", error);
    return [];
  }
}

export type SocialPulseResult = {
  activeOaths: number;
  totalBelievers: number;
  totalStakeLabel: string;
  totalReactionsReceived: number;
  recentActivity: ActivityEvent[];
  notifications: any[];
  believerInsights: any[];
};

export async function getSocialPulse(walletAddress: string): Promise<SocialPulseResult> {
  if (!hasDatabaseUrl) {
    return { 
      activeOaths: 0, 
      totalBelievers: 0, 
      totalStakeLabel: "0 SOL", 
      totalReactionsReceived: 0, 
      recentActivity: [], 
      notifications: [], 
      believerInsights: [] 
    };
  }

  try {
    const [activeOaths, totalBelievers, stakes, recentActivity, totalReactionsReceived] = await Promise.all([
      socialPrisma.commitment.count({ where: { status: "ACTIVE" } }),
      socialPrisma.belief.count(),
      socialPrisma.commitment.aggregate({
        where: { status: "ACTIVE" },
        _sum: { stakeAmountLamports: true },
      }),
      getGlobalActivity(5),
      socialPrisma.reaction ? socialPrisma.reaction.count({
        where: {
          proof: {
            commitment: {
              maker: { walletAddress }
            }
          }
        }
      }) : Promise.resolve(0),
    ]);

    return {
      activeOaths,
      totalBelievers,
      totalStakeLabel: `${formatSol(stakes._sum.stakeAmountLamports ?? 0n)} SOL`,
      totalReactionsReceived,
      recentActivity,
      notifications: [], // To be implemented with real notification logic
      believerInsights: [], // To be implemented with real insights logic
    };
  } catch (error) {
    console.error("Failed to load social pulse", error);
    return { 
      activeOaths: 0, 
      totalBelievers: 0, 
      totalStakeLabel: "0 SOL", 
      totalReactionsReceived: 0, 
      recentActivity: [], 
      notifications: [], 
      believerInsights: [] 
    };
  }
}
