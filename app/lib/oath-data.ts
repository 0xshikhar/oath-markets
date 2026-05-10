import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { coachToneLabel } from "@/lib/coach-tone";
import { canViewCommitment, sameWalletAddress } from "@/lib/oath-access";
import { verifyPrivateShareToken } from "@/lib/private-share";

const DAY_MS = 24 * 60 * 60 * 1000;
const LAMPORTS_PER_SOL = 1_000_000_000n;
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

type UserRecord = {
  walletAddress: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  worldIdVerified: boolean;
  notifyTime: string;
  timezone: string;
};

type CommitmentRecord = {
  slug: string;
  onchainAddress?: string | null;
  title: string;
  description: string | null;
  category: string;
  proofType: string;
  coachTone: string;
  stakeAmountLamports: bigint;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  requiredProofDays: number;
  status: string;
  isPublic: boolean;
  proofCount: number;
  completionRatio: number | null;
  resolvedAt: Date | null;
  createdAt: Date;
  maker: UserRecord;
  believerCount: number;
  proofSamples: ProofRecord[];
  comments: RawCommentRecord[];
  coachMessages: CoachMessageRecord[];
};

type ProofRecord = {
  id: string;
  dayNumber: number;
  textContent: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  publicNote: string | null;
  createdAt: Date;
  reactionCounts?: ReactionCounts;
};

type RawCommentRecord = {
  id: string;
  parentCommentId: string | null;
  authorName: string;
  content: string;
  createdAt: Date;
};

type CoachMessageRecord = {
  content: string;
  createdAt: Date;
};

export type ReactionCounts = {
  momentum: number;
  streak: number;
  watching: number;
  doubt: number;
  total: number;
};

type DbCommitmentSummaryRecord = {
  slug: string;
  onchainAddress: string | null;
  title: string;
  description: string | null;
  category: string;
  proofType: string;
  coachTone: string;
  stakeAmountLamports: bigint;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  requiredProofDays: number;
  status: string;
  isPublic: boolean;
  proofCount: number;
  createdAt: Date;
  maker: UserRecord;
  beliefs: { id: string }[];
};

type DbProofRecord = {
  id: string;
  dayNumber: number;
  textContent: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  publicNote: string | null;
  createdAt: Date;
  reactionCounts?: ReactionCounts;
};

type DbCommentRecord = {
  id: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date;
  author: {
    username: string | null;
    walletAddress: string;
  };
};

type DbCoachMessageRecord = {
  content: string;
  createdAt: Date;
};

type DbCommitmentDetailRecord = DbCommitmentSummaryRecord & {
  completionRatio: number | null;
  proofs: DbProofRecord[];
  comments: DbCommentRecord[];
  coachMessages: DbCoachMessageRecord[];
};

type DbUserProfileRecord = UserRecord & {
  commitments: DbCommitmentSummaryRecord[];
  beliefs: { stakeAmountLamports: bigint }[];
  _count: {
    followers: number;
    following: number;
  };
};

export type CommitmentSummary = {
  slug: string;
  onchainAddress: string | null;
  isPublic: boolean;
  title: string;
  description: string;
  category: string;
  proofType: string;
  coachTone: string;
  coachToneLabel: string;
  makerName: string;
  makerHandle: string;
  makerWalletAddress: string;
  makerVerified: boolean;
  stakeLabel: string;
  believerCount: number;
  proofCount: number;
  totalDays: number;
  daysRemaining: number;
  progressPercent: number;
  status: string;
  statusLabel: string;
  createdAtIso: string;
  createdAtLabel: string;
  endDateLabel: string;
  publicUrl: string;
};

export type CommitmentAccessMeta = {
  slug: string;
  isPublic: boolean;
  makerWalletAddress: string;
};

export type CommentThreadNode = {
  id: string;
  parentCommentId: string | null;
  authorName: string;
  content: string;
  createdAtLabel: string;
  replies: CommentThreadNode[];
};

export type CommitmentDetail = CommitmentSummary & {
  completionRatioLabel: string;
  startDateLabel: string;
  proofSamples: Array<{
    id: string;
    dayNumber: number;
    textContent: string;
    imageUrl: string | null;
    linkUrl: string | null;
    publicNote: string | null;
    createdAtLabel: string;
    reactionCounts: ReactionCounts;
  }>;
  comments: CommentThreadNode[];
  coachMessages: Array<{
    content: string;
    createdAtLabel: string;
  }>;
};

export type ProfileView = {
  displayName: string;
  handle: string;
  walletAddress: string;
  bio: string;
  verified: boolean;
  timezone: string;
  notifyTime: string;
  followerCount: number;
  followingCount: number;
  reputationScore: string;
  completedCount: number;
  activeCount: number;
  totalStakeLabel: string;
  commitments: CommitmentSummary[];
};

export type LandingStats = {
  activeOaths: number;
  totalStakeLabel: string;
  believers: number;
  completionRateLabel: string;
};

export type DashboardView = {
  active: CommitmentSummary[];
  completed: CommitmentSummary[];
  failed: CommitmentSummary[];
  inbox: Array<{
    slug: string;
    title: string;
    messages: Array<{
      role: "COACH" | "USER";
      content: string;
      createdAtLabel: string;
    }>;
  }>;
};

function ellipsify(value: string, visible = 4) {
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatLongDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSol(lamports: bigint) {
  const whole = lamports / LAMPORTS_PER_SOL;
  const fraction = lamports % LAMPORTS_PER_SOL;

  if (fraction === 0n) return whole.toString();

  const decimals = fraction.toString().padStart(9, "0").replace(/0+$/, "");

  return decimals ? `${whole}.${decimals.slice(0, 2)}` : whole.toString();
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

function buildCommentThreads(records: RawCommentRecord[]) {
  const nodes = new Map<string, CommentThreadNode & { createdAtMs: number }>();

  for (const record of records) {
    nodes.set(record.id, {
      id: record.id,
      parentCommentId: record.parentCommentId,
      authorName: record.authorName,
      content: record.content,
      createdAtLabel: formatDateLabel(record.createdAt),
      replies: [],
      createdAtMs: record.createdAt.getTime(),
    });
  }

  const roots: Array<CommentThreadNode & { createdAtMs: number }> = [];

  for (const node of nodes.values()) {
    if (node.parentCommentId && nodes.has(node.parentCommentId)) {
      nodes.get(node.parentCommentId)?.replies.push(node);
      continue;
    }

    roots.push(node);
  }

  const sortRecursive = (items: Array<CommentThreadNode & { createdAtMs: number }>) => {
    items.sort((left, right) => left.createdAtMs - right.createdAtMs);
    for (const item of items) {
      sortRecursive(item.replies as Array<CommentThreadNode & { createdAtMs: number }>);
    }
  };

  sortRecursive(roots);

  const stripCreatedAt = (
    items: Array<CommentThreadNode & { createdAtMs: number }>
  ): CommentThreadNode[] =>
    items.map((item) => {
      const { createdAtMs, replies, ...rest } = item;
      void createdAtMs;

      return {
        ...rest,
        replies: stripCreatedAt(
          replies as Array<CommentThreadNode & { createdAtMs: number }>
        ),
      };
    });

  return stripCreatedAt(roots);
}

function toHandle(user: UserRecord) {
  return user.username ? `@${user.username}` : ellipsify(user.walletAddress, 4);
}

function getDisplayName(user: UserRecord) {
  if (user.username) {
    const name = user.username.split(".")[0];
    return name
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return ellipsify(user.walletAddress, 4);
}

function mapCommitment(commitment: CommitmentRecord): CommitmentSummary {
  const now = Date.now();
  const daysRemaining = Math.max(
    Math.ceil((commitment.endDate.getTime() - now) / DAY_MS),
    0
  );
  const progressPercent = Math.min(
    100,
    Math.round((commitment.proofCount / commitment.totalDays) * 100)
  );

  return {
    slug: commitment.slug,
    onchainAddress: commitment.onchainAddress ?? null,
    isPublic: commitment.isPublic,
    title: commitment.title,
    description: commitment.description ?? "",
    category: commitment.category,
    proofType: commitment.proofType,
    coachTone: commitment.coachTone,
    coachToneLabel: coachToneLabel(commitment.coachTone),
    makerName: getDisplayName(commitment.maker),
    makerHandle: toHandle(commitment.maker),
    makerWalletAddress: commitment.maker.walletAddress,
    makerVerified: commitment.maker.worldIdVerified,
    stakeLabel: `${formatSol(commitment.stakeAmountLamports)} SOL`,
    believerCount: commitment.believerCount,
    proofCount: commitment.proofCount,
    totalDays: commitment.totalDays,
    daysRemaining,
    progressPercent,
    status: commitment.status,
    statusLabel: commitment.status.replaceAll("_", " "),
    createdAtIso: commitment.createdAt.toISOString(),
    createdAtLabel: formatDateLabel(commitment.createdAt),
    endDateLabel: formatLongDateLabel(commitment.endDate),
    publicUrl: `/c/${commitment.slug}`,
  };
}

function mapCommitmentDetail(commitment: CommitmentRecord): CommitmentDetail {
  const summary = mapCommitment(commitment);

  return {
    ...summary,
    completionRatioLabel: `${Math.round(
      (commitment.proofCount / commitment.requiredProofDays) * 100
    )}%`,
    startDateLabel: formatLongDateLabel(commitment.startDate),
    proofSamples: commitment.proofSamples.map((proof) => ({
      id: proof.id,
      dayNumber: proof.dayNumber,
      textContent: proof.textContent ?? "",
      imageUrl: proof.imageUrl,
      linkUrl: proof.linkUrl,
      publicNote: proof.publicNote,
      createdAtLabel: formatDateLabel(proof.createdAt),
      reactionCounts: proof.reactionCounts ?? emptyReactionCounts(),
    })),
    comments: buildCommentThreads(commitment.comments),
    coachMessages: commitment.coachMessages.map((message) => ({
      content: message.content,
      createdAtLabel: formatDateLabel(message.createdAt),
    })),
  };
}

function sortFeaturedCommitments(commitments: CommitmentSummary[]) {
  return [...commitments].sort((a, b) => {
    if (b.believerCount !== a.believerCount) {
      return b.believerCount - a.believerCount;
    }

    if (b.progressPercent !== a.progressPercent) {
      return b.progressPercent - a.progressPercent;
    }

    return a.daysRemaining - b.daysRemaining;
  });
}

type ExploreSort = "believers" | "recent" | "ending";

type ExploreCommitmentFilters = {
  category?: string;
  search?: string;
  sort?: ExploreSort;
  limit?: number;
};

function filterExploreCommitments(
  commitments: CommitmentSummary[],
  filters: ExploreCommitmentFilters = {}
) {
  const category = filters.category?.trim().toUpperCase() ?? "ALL";
  const search = filters.search?.trim().toLowerCase() ?? "";
  const sort = filters.sort ?? "believers";

  const filtered = commitments.filter((commitment) => {
    const matchesCategory = category === "ALL" || commitment.category === category;
    const matchesSearch =
      search.length === 0 ||
      commitment.title.toLowerCase().includes(search) ||
      commitment.description.toLowerCase().includes(search) ||
      commitment.makerName.toLowerCase().includes(search) ||
      commitment.makerHandle.toLowerCase().includes(search) ||
      commitment.proofType.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  if (sort === "recent") {
    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime()
    );
  }

  if (sort === "ending") {
    return [...filtered].sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  return sortFeaturedCommitments(filtered);
}

async function loadDbCommitments(limit = 6): Promise<CommitmentSummary[]> {
  if (!hasDatabaseUrl) {
    return [];
  }

  try {
    const commitments = (await prisma.commitment.findMany({
      where: { isPublic: true },
      orderBy: [{ proofCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        slug: true,
        onchainAddress: true,
        title: true,
        description: true,
        category: true,
        proofType: true,
        coachTone: true,
        stakeAmountLamports: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        requiredProofDays: true,
        status: true,
        isPublic: true,
        proofCount: true,
        createdAt: true,
        maker: {
          select: {
            walletAddress: true,
            username: true,
            bio: true,
            avatarUrl: true,
            worldIdVerified: true,
            notifyTime: true,
            timezone: true,
          },
        },
        beliefs: {
          select: { id: true },
        },
      },
    })) as DbCommitmentSummaryRecord[];

    if (commitments.length === 0) return [];

    return commitments.map((record: DbCommitmentSummaryRecord) =>
      mapCommitment({
        slug: record.slug,
        onchainAddress: record.onchainAddress,
        title: record.title,
        description: record.description,
        category: record.category,
        proofType: record.proofType,
        coachTone: record.coachTone,
        stakeAmountLamports: record.stakeAmountLamports,
        startDate: record.startDate,
        endDate: record.endDate,
        totalDays: record.totalDays,
        requiredProofDays: record.requiredProofDays,
        status: record.status,
        isPublic: record.isPublic,
        proofCount: record.proofCount,
        completionRatio: null,
        resolvedAt: null,
        createdAt: record.createdAt,
        maker: record.maker,
        believerCount: record.beliefs.length,
        proofSamples: [],
        comments: [],
        coachMessages: [],
      })
    );
  } catch (error) {
    console.error("Failed to load commitments", error);
    return [];
  }
}

async function loadDbCommitmentAccess(
  slug?: string
): Promise<CommitmentAccessMeta | null> {
  if (!slug || !hasDatabaseUrl) {
    return null;
  }

  try {
    const record = (await prisma.commitment.findUnique({
      where: { slug },
      select: {
        slug: true,
        isPublic: true,
        maker: {
          select: {
            walletAddress: true,
          },
        },
      },
    })) as { slug: string; isPublic: boolean; maker: { walletAddress: string } } | null;

    if (!record) return null;

    return {
      slug: record.slug,
      isPublic: record.isPublic,
      makerWalletAddress: record.maker.walletAddress,
    };
  } catch (error) {
    console.error(`Failed to load commitment access for ${slug}`, error);
    return null;
  }
}

async function loadDbCommitment(
  slug?: string,
  viewerWalletAddress?: string | null,
  accessToken?: string | null
): Promise<CommitmentDetail | null> {
  if (!slug || !hasDatabaseUrl) {
    return null;
  }

  try {
    const access = await loadDbCommitmentAccess(slug);
    const sharedAccess = Boolean(
      access &&
        verifyPrivateShareToken(accessToken, {
          slug: access.slug,
          makerWalletAddress: access.makerWalletAddress,
        })
    );
    if (!access || !canViewCommitment(access, viewerWalletAddress, sharedAccess)) {
      return null;
    }

    const record = (await prisma.commitment.findUnique({
      where: { slug },
      select: {
        slug: true,
        onchainAddress: true,
        title: true,
        description: true,
        category: true,
        proofType: true,
        coachTone: true,
        stakeAmountLamports: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        requiredProofDays: true,
        status: true,
        isPublic: true,
        proofCount: true,
        completionRatio: true,
        createdAt: true,
        maker: {
          select: {
            walletAddress: true,
            username: true,
            bio: true,
            avatarUrl: true,
            worldIdVerified: true,
            notifyTime: true,
            timezone: true,
          },
        },
        proofs: {
          orderBy: { dayNumber: "desc" },
          select: {
            id: true,
            dayNumber: true,
            textContent: true,
            imageUrl: true,
            linkUrl: true,
            publicNote: true,
            createdAt: true,
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            parentCommentId: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                username: true,
                walletAddress: true,
              },
            },
          },
        },
        coachMessages: {
          where: {
            role: "COACH",
          },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: {
            content: true,
            createdAt: true,
          },
        },
        beliefs: {
          select: { id: true },
        },
      } as unknown as Prisma.CommitmentSelect,
    })) as DbCommitmentDetailRecord | null;

    if (!record) return null;

    return mapCommitmentDetail({
      slug: record.slug,
      onchainAddress: record.onchainAddress,
      title: record.title,
      description: record.description,
      category: record.category,
      proofType: record.proofType,
      coachTone: record.coachTone,
      stakeAmountLamports: record.stakeAmountLamports,
      startDate: record.startDate,
      endDate: record.endDate,
      totalDays: record.totalDays,
      requiredProofDays: record.requiredProofDays,
      status: record.status,
      isPublic: record.isPublic,
      proofCount: record.proofCount,
      completionRatio: record.completionRatio,
      resolvedAt: null,
      createdAt: record.createdAt,
      maker: record.maker,
      believerCount: record.beliefs.length,
      proofSamples: record.proofs.map((proof) => ({
        id: proof.id,
        dayNumber: proof.dayNumber,
        textContent: proof.textContent,
        imageUrl: proof.imageUrl,
        linkUrl: proof.linkUrl,
        publicNote: proof.publicNote,
        createdAt: proof.createdAt,
        reactionCounts: emptyReactionCounts(),
      })),
      comments: record.comments.map((comment) => ({
        id: comment.id,
        parentCommentId: comment.parentCommentId,
        authorName:
          comment.author.username ?? ellipsify(comment.author.walletAddress, 4),
        content: comment.content,
        createdAt: comment.createdAt,
      })),
      coachMessages: record.coachMessages.map((message) => ({
        content: message.content,
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    console.error(`Failed to load commitment ${slug}`, error);
    return null;
  }
}

async function loadDbProfiles(): Promise<ProfileView[]> {
  if (!hasDatabaseUrl) {
    return [];
  }

  try {
    const users = (await prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        walletAddress: true,
        username: true,
        bio: true,
        avatarUrl: true,
        worldIdVerified: true,
        notifyTime: true,
        timezone: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
        commitments: {
          where: {
            isPublic: true,
          },
          select: {
            slug: true,
            title: true,
            description: true,
            category: true,
            proofType: true,
            coachTone: true,
            stakeAmountLamports: true,
            startDate: true,
            endDate: true,
            totalDays: true,
            requiredProofDays: true,
            status: true,
            isPublic: true,
            proofCount: true,
            createdAt: true,
            beliefs: {
              select: {
                id: true,
              },
            },
          },
        },
        beliefs: {
          select: {
            stakeAmountLamports: true,
          },
        },
      },
    })) as unknown as DbUserProfileRecord[];

    if (users.length === 0) {
      return [];
    }

    return users.map((user) => {
      const commitmentRecords: CommitmentRecord[] = user.commitments.map(
        (commitment) => ({
          slug: commitment.slug,
          title: commitment.title,
          description: commitment.description,
          category: commitment.category,
          proofType: commitment.proofType,
          coachTone: commitment.coachTone,
          stakeAmountLamports: commitment.stakeAmountLamports,
          startDate: commitment.startDate,
          endDate: commitment.endDate,
          totalDays: commitment.totalDays,
          requiredProofDays: commitment.requiredProofDays,
          status: commitment.status,
          isPublic: commitment.isPublic,
          proofCount: commitment.proofCount,
          completionRatio: null,
          resolvedAt: null,
          createdAt: commitment.createdAt,
          maker: user,
          believerCount: commitment.beliefs.length,
          proofSamples: [],
          comments: [],
          coachMessages: [],
        })
      );

      const commitments = commitmentRecords.map(mapCommitment);

      return {
        displayName: getDisplayName(user),
        handle: toHandle(user),
        walletAddress: user.walletAddress,
        bio: user.bio ?? "No bio yet.",
        verified: user.worldIdVerified,
        timezone: user.timezone,
        notifyTime: user.notifyTime,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        reputationScore: formatCompactNumber(
          commitments.filter((commitment) => commitment.status === "COMPLETED")
            .length * 120 +
            user.beliefs.length * 18 +
            (user.worldIdVerified ? 75 : 0)
        ),
        completedCount: commitments.filter(
          (commitment) => commitment.status === "COMPLETED"
        ).length,
        activeCount: commitments.filter(
          (commitment) => commitment.status === "ACTIVE"
        ).length,
        totalStakeLabel: `${formatSol(
          commitmentRecords.reduce(
            (sum: bigint, commitment: CommitmentRecord) =>
              sum + commitment.stakeAmountLamports,
            0n
          )
        )} SOL`,
        commitments,
      } satisfies ProfileView;
    });
  } catch (error) {
    console.error("Failed to load profiles", error);
    return [];
  }
}

async function loadDbDashboardCommitments(
  viewerWalletAddress?: string | null
): Promise<CommitmentSummary[]> {
  if (!hasDatabaseUrl) {
    return [];
  }

  if (viewerWalletAddress) {
    const user = await prisma.user.findUnique({
      where: { walletAddress: viewerWalletAddress },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    const commitments = (await prisma.commitment.findMany({
      where: {
        makerId: user.id,
      },
      orderBy: [{ createdAt: "desc" }],
      take: 48,
      select: {
        slug: true,
        onchainAddress: true,
        title: true,
        description: true,
        category: true,
        proofType: true,
        coachTone: true,
        stakeAmountLamports: true,
        startDate: true,
        endDate: true,
        totalDays: true,
        requiredProofDays: true,
        status: true,
        isPublic: true,
        proofCount: true,
        createdAt: true,
        maker: {
          select: {
            walletAddress: true,
            username: true,
            bio: true,
            avatarUrl: true,
            worldIdVerified: true,
            notifyTime: true,
            timezone: true,
          },
        },
        beliefs: {
          select: { id: true },
        },
      },
    })) as DbCommitmentSummaryRecord[];

    return commitments.map((record: DbCommitmentSummaryRecord) =>
      mapCommitment({
        slug: record.slug,
        onchainAddress: record.onchainAddress,
        title: record.title,
        description: record.description,
        category: record.category,
        proofType: record.proofType,
        coachTone: record.coachTone,
        stakeAmountLamports: record.stakeAmountLamports,
        startDate: record.startDate,
        endDate: record.endDate,
        totalDays: record.totalDays,
        requiredProofDays: record.requiredProofDays,
        status: record.status,
        isPublic: record.isPublic,
        proofCount: record.proofCount,
        completionRatio: null,
        resolvedAt: null,
        createdAt: record.createdAt,
        maker: record.maker,
        believerCount: record.beliefs.length,
        proofSamples: [],
        comments: [],
        coachMessages: [],
      })
    );
  }

  return loadDbCommitments(9);
}

type DbCoachInboxMessageRecord = {
  content: string;
  createdAt: Date;
  role: "COACH" | "USER";
  commitment: {
    slug: string;
    title: string;
    status: string;
    isPublic: boolean;
    maker: {
      walletAddress: string;
    };
  };
};

async function loadDbCoachInbox(
  viewerWalletAddress?: string | null
): Promise<DashboardView["inbox"] | null> {
  if (!hasDatabaseUrl) {
    return [];
  }

  try {
    const records = (await prisma.coachMessage.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 48,
      select: {
        content: true,
        createdAt: true,
        role: true,
        commitment: {
          select: {
            slug: true,
            title: true,
            status: true,
            isPublic: true,
            maker: {
              select: {
                walletAddress: true,
              },
            },
          },
        },
      },
    })) as DbCoachInboxMessageRecord[];

    if (records.length === 0) {
      return [];
    }

    const threads = new Map<
      string,
      {
        slug: string;
        title: string;
        latestAt: number;
        messages: Array<{
          role: "COACH" | "USER";
          content: string;
          createdAt: Date;
        }>;
      }
    >();

    for (const record of records) {
      const isVisibleToViewer = viewerWalletAddress
        ? sameWalletAddress(record.commitment.maker.walletAddress, viewerWalletAddress)
        : record.commitment.isPublic;

      if (record.commitment.status !== "ACTIVE" || !isVisibleToViewer) {
        continue;
      }

      const existing = threads.get(record.commitment.slug) ?? {
        slug: record.commitment.slug,
        title: record.commitment.title,
        latestAt: record.createdAt.getTime(),
        messages: [],
      };

      existing.latestAt = Math.max(existing.latestAt, record.createdAt.getTime());
      existing.messages.push({
        role: record.role,
        content: record.content,
        createdAt: record.createdAt,
      });

      threads.set(existing.slug, existing);
    }

    return Array.from(threads.values())
      .sort((a, b) => b.latestAt - a.latestAt)
      .slice(0, 4)
      .map((thread) => ({
        slug: thread.slug,
        title: thread.title,
        messages: thread.messages
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((message) => ({
            role: message.role,
            content: message.content,
            createdAtLabel: formatDateLabel(message.createdAt),
          })),
      }));
  } catch (error) {
    console.error("Failed to load coach inbox", error);
    return [];
  }
}

export async function getLandingStats(): Promise<LandingStats> {
  if (!hasDatabaseUrl) {
    return {
      activeOaths: 0,
      totalStakeLabel: "0 SOL",
      believers: 0,
      completionRateLabel: "0%",
    };
  }

  try {
    const [activeOaths, stakes, believers, completed] = await Promise.all([
      prisma.commitment.count({ where: { isPublic: true, status: "ACTIVE" } }),
      prisma.commitment.aggregate({
        where: { isPublic: true },
        _sum: { stakeAmountLamports: true },
      }),
      prisma.belief.count(),
      prisma.commitment.count({
        where: { isPublic: true, status: "COMPLETED" },
      }),
    ]);

    return {
      activeOaths,
      totalStakeLabel: `${formatSol(stakes._sum.stakeAmountLamports ?? 0n)} SOL`,
      believers,
      completionRateLabel: `${Math.round((completed / Math.max(activeOaths, 1)) * 100)}%`,
    };
  } catch (error) {
    console.error("Failed to load landing stats", error);
    return {
      activeOaths: 0,
      totalStakeLabel: "0 SOL",
      believers: 0,
      completionRateLabel: "0%",
    };
  }
}

export async function getFeaturedCommitments(limit = 3) {
  const commitments = await loadDbCommitments(limit);
  return sortFeaturedCommitments(commitments).slice(0, limit);
}

export async function getExploreCommitments(
  filters: ExploreCommitmentFilters = {}
) {
  const limit = filters.limit ?? 12;
  const commitments = await loadDbCommitments(Math.max(limit, 50));
  return filterExploreCommitments(commitments, filters).slice(0, limit);
}

export async function getCommitmentAccessBySlug(slug?: string) {
  return loadDbCommitmentAccess(slug);
}

export async function getCommitmentBySlug(
  slug?: string,
  viewerWalletAddress?: string | null,
  accessToken?: string | null
) {
  const commitment = await loadDbCommitment(slug, viewerWalletAddress, accessToken);
  return commitment;
}

export async function getProfileByWallet(identifier?: string) {
  const profiles = await loadDbProfiles();
  const normalized = identifier?.trim();
  const normalizedHandle = normalized?.toLowerCase();

  if (!normalized) {
    return profiles[0] ?? null;
  }

  const profile = profiles.find(
    (entry) =>
      sameWalletAddress(entry.walletAddress, normalized) ||
      entry.handle.toLowerCase() === normalizedHandle ||
      entry.handle.toLowerCase() === `@${normalizedHandle}`
  );

  if (profile) return profile;

  return null;
}

export async function getDashboardSummary(viewerWalletAddress?: string | null) {
  const commitments = viewerWalletAddress
    ? await loadDbDashboardCommitments(viewerWalletAddress)
    : await getExploreCommitments({ limit: 9 });
  const active = commitments.filter((commitment) => commitment.status === "ACTIVE");
  const completed = commitments.filter((commitment) => commitment.status === "COMPLETED");
  const failed = commitments.filter((commitment) => commitment.status === "FAILED");
  const inbox = await loadDbCoachInbox(viewerWalletAddress);

  return {
    active,
    completed,
    failed,
    inbox: inbox ?? [],
  } satisfies DashboardView;
}
