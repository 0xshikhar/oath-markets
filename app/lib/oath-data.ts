import { prisma } from "@/lib/prisma";

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
  title: string;
  description: string | null;
  category: string;
  proofType: string;
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
  comments: CommentRecord[];
  coachMessages: CoachMessageRecord[];
};

type ProofRecord = {
  dayNumber: number;
  textContent: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  publicNote: string | null;
  createdAt: Date;
};

type CommentRecord = {
  authorName: string;
  content: string;
  createdAt: Date;
};

type CoachMessageRecord = {
  content: string;
  createdAt: Date;
};

type DbCommitmentSummaryRecord = {
  slug: string;
  title: string;
  description: string | null;
  category: string;
  proofType: string;
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
  dayNumber: number;
  textContent: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  publicNote: string | null;
  createdAt: Date;
};

type DbCommentRecord = {
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
};

export type CommitmentSummary = {
  slug: string;
  title: string;
  description: string;
  category: string;
  proofType: string;
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

export type CommitmentDetail = CommitmentSummary & {
  completionRatioLabel: string;
  startDateLabel: string;
  proofSamples: Array<{
    dayNumber: number;
    textContent: string;
    imageUrl: string | null;
    linkUrl: string | null;
    publicNote: string | null;
    createdAtLabel: string;
  }>;
  comments: Array<{
    authorName: string;
    content: string;
    createdAtLabel: string;
  }>;
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
      content: string;
      createdAtLabel: string;
    }>;
  }>;
};

const sampleUsers: UserRecord[] = [
  {
    walletAddress: "9xF3J1mN4qT8pW2yR5bH7cK6dL8vN3sA1eR6tG2uM9Q4",
    username: "noah.builds",
    bio: "Public shipping, no excuses, no hiding.",
    avatarUrl: null,
    worldIdVerified: true,
    notifyTime: "09:00",
    timezone: "Asia/Kolkata",
  },
  {
    walletAddress: "4nV8bR2sK5mD7pQ1wA6tY9uH3cF8gL2zN4jP6rE1xT5",
    username: "maya.run",
    bio: "Runs, reads, and proof posts before breakfast.",
    avatarUrl: null,
    worldIdVerified: true,
    notifyTime: "07:30",
    timezone: "America/Los_Angeles",
  },
  {
    walletAddress: "7qC2dK9vH4mT8xN1pR6sY3bF5wL8aG2jM4uE9tQ6zV1",
    username: "saanvi.ships",
    bio: "Daily build logs and public accountability.",
    avatarUrl: null,
    worldIdVerified: false,
    notifyTime: "21:00",
    timezone: "Asia/Kolkata",
  },
];

const sampleCommitments: CommitmentRecord[] = [
  {
    slug: "ship-in-public",
    title: "Ship one public build note every day for 30 days",
    description:
      "Short proof, one screenshot, one sentence about the thing that moved forward. No hiding behind private progress.",
    category: "WORK",
    proofType: "TEXT",
    stakeAmountLamports: 1_000_000_000n,
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    endDate: new Date("2026-05-01T00:00:00.000Z"),
    totalDays: 30,
    requiredProofDays: 30,
    status: "ACTIVE",
    isPublic: true,
    proofCount: 18,
    completionRatio: 0.6,
    resolvedAt: null,
    createdAt: new Date("2026-03-27T00:00:00.000Z"),
    maker: sampleUsers[0],
    believerCount: 14,
    proofSamples: [
      {
        dayNumber: 18,
        textContent:
          "Reworked the pricing card and finally cut the copy down to one sentence.",
        imageUrl:
          "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
        linkUrl: null,
        publicNote: "The public page is finally feeling like a product.",
        createdAt: new Date("2026-04-28T18:00:00.000Z"),
      },
      {
        dayNumber: 17,
        textContent: "Moved the dashboard logic into a server component.",
        imageUrl: null,
        linkUrl: null,
        publicNote: "Less client state, more shipping.",
        createdAt: new Date("2026-04-27T18:00:00.000Z"),
      },
    ],
    comments: [
      {
        authorName: "maya.run",
        content: "This is the kind of public pressure that actually works.",
        createdAt: new Date("2026-04-28T20:00:00.000Z"),
      },
      {
        authorName: "saanvi.ships",
        content: "Watching the streak move is more motivating than any task app.",
        createdAt: new Date("2026-04-29T08:30:00.000Z"),
      },
    ],
    coachMessages: [
      {
        content:
          "Day 18 is in range. Keep the proof small and finish before the window closes.",
        createdAt: new Date("2026-04-28T09:00:00.000Z"),
      },
    ],
  },
  {
    slug: "sunrise-5k",
    title: "Run 5K before sunrise for 21 straight days",
    description:
      "A public fitness commitment with proof photos, route screenshots, and a streak page that tracks every morning run.",
    category: "FITNESS",
    proofType: "PHOTO",
    stakeAmountLamports: 500_000_000n,
    startDate: new Date("2026-04-10T00:00:00.000Z"),
    endDate: new Date("2026-04-30T00:00:00.000Z"),
    totalDays: 21,
    requiredProofDays: 21,
    status: "ACTIVE",
    isPublic: true,
    proofCount: 11,
    completionRatio: 0.52,
    resolvedAt: null,
    createdAt: new Date("2026-04-09T00:00:00.000Z"),
    maker: sampleUsers[1],
    believerCount: 9,
    proofSamples: [
      {
        dayNumber: 11,
        textContent: "Felt heavy at first, but the last kilometer clicked.",
        imageUrl:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80",
        linkUrl: null,
        publicNote: "Still alive, still on pace.",
        createdAt: new Date("2026-04-29T11:15:00.000Z"),
      },
    ],
    comments: [
      {
        authorName: "noah.builds",
        content: "The public log makes the early alarm feel real.",
        createdAt: new Date("2026-04-29T12:00:00.000Z"),
      },
    ],
    coachMessages: [
      {
        content: "Your pace is on track. Protect the streak by keeping the proof simple.",
        createdAt: new Date("2026-04-29T06:30:00.000Z"),
      },
    ],
  },
  {
    slug: "learn-anchor",
    title: "Read one Anchor and Solana chapter every day for 60 days",
    description:
      "A learning oath that pairs reading with public notes, code snippets, and a reputation score that keeps the pressure alive.",
    category: "LEARNING",
    proofType: "LINK",
    stakeAmountLamports: 2_000_000_000n,
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    endDate: new Date("2026-04-30T00:00:00.000Z"),
    totalDays: 60,
    requiredProofDays: 60,
    status: "ACTIVE",
    isPublic: true,
    proofCount: 42,
    completionRatio: 0.7,
    resolvedAt: null,
    createdAt: new Date("2026-02-28T00:00:00.000Z"),
    maker: sampleUsers[2],
    believerCount: 18,
    proofSamples: [
      {
        dayNumber: 42,
        textContent:
          "Finished the escrow section and traced the account flow end-to-end.",
        imageUrl: null,
        linkUrl: "https://solana.com/docs",
        publicNote: "The notes are doing the heavy lifting now.",
        createdAt: new Date("2026-04-29T07:45:00.000Z"),
      },
      {
        dayNumber: 41,
        textContent:
          "Mapped the instruction accounts before touching the code. Less guessing, more clarity.",
        imageUrl: null,
        linkUrl: "https://www.anchor-lang.com/docs",
        publicNote: null,
        createdAt: new Date("2026-04-28T07:45:00.000Z"),
      },
    ],
    comments: [
      {
        authorName: "maya.run",
        content: "This would have saved me a week the first time I touched Anchor.",
        createdAt: new Date("2026-04-29T09:00:00.000Z"),
      },
    ],
    coachMessages: [
      {
        content:
          "You are above the required pace. Keep the proof format compact so the streak stays effortless.",
        createdAt: new Date("2026-04-29T08:00:00.000Z"),
      },
    ],
  },
];

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
    title: commitment.title,
    description: commitment.description ?? "",
    category: commitment.category,
    proofType: commitment.proofType,
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
      dayNumber: proof.dayNumber,
      textContent: proof.textContent ?? "",
      imageUrl: proof.imageUrl,
      linkUrl: proof.linkUrl,
      publicNote: proof.publicNote,
      createdAtLabel: formatDateLabel(proof.createdAt),
    })),
    comments: commitment.comments.map((comment) => ({
      authorName: comment.authorName,
      content: comment.content,
      createdAtLabel: formatDateLabel(comment.createdAt),
    })),
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

async function loadDbCommitments(limit = 6): Promise<CommitmentSummary[]> {
  if (!hasDatabaseUrl) {
    return sampleCommitments.map(mapCommitment).slice(0, limit);
  }

  try {
    const commitments = await prisma.commitment.findMany({
      where: { isPublic: true },
      orderBy: [{ proofCount: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        slug: true,
        title: true,
        description: true,
        category: true,
        proofType: true,
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
    });

    if (commitments.length === 0) return sampleCommitments.map(mapCommitment);

    return commitments.map((record: DbCommitmentSummaryRecord) =>
      mapCommitment({
        slug: record.slug,
        title: record.title,
        description: record.description,
        category: record.category,
        proofType: record.proofType,
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
  } catch {
    return sampleCommitments.map(mapCommitment);
  }
}

async function loadDbCommitment(slug: string): Promise<CommitmentDetail | null> {
  if (!hasDatabaseUrl) {
    const fallback =
      sampleCommitments.find((commitment) => commitment.slug === slug) ??
      sampleCommitments[0];
    return mapCommitmentDetail(fallback);
  }

  try {
    const record = (await prisma.commitment.findUnique({
      where: { slug },
      select: {
        slug: true,
        title: true,
        description: true,
        category: true,
        proofType: true,
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
            dayNumber: true,
            textContent: true,
            imageUrl: true,
            linkUrl: true,
            publicNote: true,
            createdAt: true,
          },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          select: {
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
      },
    })) as DbCommitmentDetailRecord | null;

    if (!record) return null;

    return mapCommitmentDetail({
      slug: record.slug,
      title: record.title,
      description: record.description,
      category: record.category,
      proofType: record.proofType,
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
        dayNumber: proof.dayNumber,
        textContent: proof.textContent,
        imageUrl: proof.imageUrl,
        linkUrl: proof.linkUrl,
        publicNote: proof.publicNote,
        createdAt: proof.createdAt,
      })),
      comments: record.comments.map((comment) => ({
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
  } catch {
    const fallback =
      sampleCommitments.find((commitment) => commitment.slug === slug) ??
      sampleCommitments[0];
    return mapCommitmentDetail(fallback);
  }
}

async function loadDbProfiles(): Promise<ProfileView[]> {
  if (!hasDatabaseUrl) {
    return sampleUsers.map((user) => {
      const commitments = sampleCommitments.filter(
        (commitment) => commitment.maker.walletAddress === user.walletAddress
      );

      return mapProfileFromFallback(user, commitments);
    });
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
        commitments: {
          select: {
            slug: true,
            title: true,
            description: true,
            category: true,
            proofType: true,
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
    })) as DbUserProfileRecord[];

    if (users.length === 0) {
      return sampleUsers.map((user) => {
        const commitments = sampleCommitments.filter(
          (commitment) => commitment.maker.walletAddress === user.walletAddress
        );

        return mapProfileFromFallback(user, commitments);
      });
    }

    return users.map((user) => {
      const commitmentRecords: CommitmentRecord[] = user.commitments.map(
        (commitment) => ({
          slug: commitment.slug,
          title: commitment.title,
          description: commitment.description,
          category: commitment.category,
          proofType: commitment.proofType,
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
  } catch {
    return sampleUsers.map((user) => {
      const commitments = sampleCommitments.filter(
        (commitment) => commitment.maker.walletAddress === user.walletAddress
      );

      return mapProfileFromFallback(user, commitments);
    });
  }
}

function mapProfileFromFallback(
  user: UserRecord,
  commitments: CommitmentRecord[]
): ProfileView {
  return {
    displayName: getDisplayName(user),
    handle: toHandle(user),
    walletAddress: user.walletAddress,
    bio: user.bio ?? "No bio yet.",
    verified: user.worldIdVerified,
    timezone: user.timezone,
    notifyTime: user.notifyTime,
    reputationScore: formatCompactNumber(
      commitments.filter((commitment) => commitment.status === "COMPLETED")
        .length * 120 +
        commitments.reduce((sum, commitment) => sum + commitment.believerCount, 0) *
          6 +
        (user.worldIdVerified ? 75 : 0)
    ),
    completedCount: commitments.filter(
      (commitment) => commitment.status === "COMPLETED"
    ).length,
    activeCount: commitments.filter((commitment) => commitment.status === "ACTIVE")
      .length,
    totalStakeLabel: `${formatSol(
      commitments.reduce(
        (sum, commitment) => sum + commitment.stakeAmountLamports,
        0n
      )
    )} SOL`,
    commitments: commitments.map(mapCommitment),
  };
}

export async function getLandingStats(): Promise<LandingStats> {
  if (!hasDatabaseUrl) {
    const activeOaths = sampleCommitments.filter(
      (commitment) => commitment.status === "ACTIVE"
    ).length;
    const believers = sampleCommitments.reduce(
      (sum, commitment) => sum + commitment.believerCount,
      0
    );
    const totalStakeLamports = sampleCommitments.reduce(
      (sum, commitment) => sum + commitment.stakeAmountLamports,
      0n
    );

    return {
      activeOaths,
      totalStakeLabel: `${formatSol(totalStakeLamports)} SOL`,
      believers,
      completionRateLabel: "68%",
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

    if (activeOaths === 0 && believers === 0) {
      throw new Error("Fallback to seeded preview data");
    }

    return {
      activeOaths,
      totalStakeLabel: `${formatSol(stakes._sum.stakeAmountLamports ?? 0n)} SOL`,
      believers,
      completionRateLabel: `${Math.round((completed / Math.max(activeOaths, 1)) * 100)}%`,
    };
  } catch {
    return {
      activeOaths: sampleCommitments.filter(
        (commitment) => commitment.status === "ACTIVE"
      ).length,
      totalStakeLabel: `${formatSol(
        sampleCommitments.reduce(
          (sum, commitment) => sum + commitment.stakeAmountLamports,
          0n
        )
      )} SOL`,
      believers: sampleCommitments.reduce(
        (sum, commitment) => sum + commitment.believerCount,
        0
      ),
      completionRateLabel: "68%",
    };
  }
}

export async function getFeaturedCommitments(limit = 3) {
  const commitments = await loadDbCommitments(limit);
  return sortFeaturedCommitments(commitments).slice(0, limit);
}

export async function getExploreCommitments(limit = 12) {
  const commitments = await loadDbCommitments(Math.max(limit, 6));
  return sortFeaturedCommitments(commitments).slice(0, limit);
}

export async function getCommitmentBySlug(slug: string) {
  const commitment = await loadDbCommitment(slug);
  if (commitment) return commitment;

  return mapCommitmentDetail(sampleCommitments[0]);
}

export async function getProfileByWallet(identifier: string) {
  const profiles = await loadDbProfiles();
  const normalized = identifier.toLowerCase();
  const profile = profiles.find(
    (entry) =>
      entry.walletAddress.toLowerCase() === normalized ||
      entry.handle.toLowerCase() === normalized ||
      entry.handle.toLowerCase() === `@${normalized}`
  );

  if (profile) return profile;

  return profiles[0];
}

export async function getDashboardSummary() {
  const commitments = await getExploreCommitments(9);
  const active = commitments.filter((commitment) => commitment.status === "ACTIVE");
  const completed = commitments.filter((commitment) => commitment.status === "COMPLETED");
  const failed = commitments.filter((commitment) => commitment.status === "FAILED");

  return {
    active,
    completed,
    failed,
    inbox: [
      {
        slug: "ship-in-public",
        title: "Ship one public build note every day for 30 days",
        messages: [
          {
            content: "Your coach checks in at 09:00 local time.",
            createdAtLabel: "Today",
          },
          {
            content: "Proof submissions update the streak page instantly.",
            createdAtLabel: "Today",
          },
        ],
      },
      {
        slug: "sunrise-5k",
        title: "Run 5K before sunrise for 21 straight days",
        messages: [
          {
            content: "You are 2 days ahead of the target pace.",
            createdAtLabel: "Today",
          },
        ],
      },
    ],
  } satisfies DashboardView;
}
