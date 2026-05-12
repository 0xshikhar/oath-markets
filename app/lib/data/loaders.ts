import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewCommitment, sameWalletAddress } from "@/lib/oath-access";
import { verifyPrivateShareToken } from "@/lib/private-share";
import { mapCommitment, mapCommitmentDetail, sortFeaturedCommitments, filterExploreCommitments } from "./mappers";
import { formatSol, formatDateLabel, formatCompactNumber, emptyReactionCounts, getDisplayName, toHandle } from "./formatters";
import type {
  CommitmentSummary,
  CommitmentDetail,
  ProfileView,
  LandingStats,
  DashboardView,
  ExploreCommitmentFilters,
  DbCommitmentSummaryRecord,
  DbCommitmentDetailRecord,
  DbUserProfileRecord,
  DbCoachInboxMessageRecord,
  CommitmentRecord,
  DbProofRecord,
  RawCommentRecord,
} from "./types";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

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
        id: true,
        slug: true,
        onchainAddress: true,
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
            name: true,
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
        id: record.id,
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
): Promise<{ slug: string; isPublic: boolean; makerWalletAddress: string } | null> {
  if (!slug || !hasDatabaseUrl) {
    return null;
  }

  try {
    const record = (await prisma.commitment.findUnique({
      where: { slug },
      select: {
        id: true,
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
        id: true,
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
            name: true,
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
                name: true,
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
          select: { 
            id: true,
            stakeAmountLamports: true,
            believer: {
              select: {
                walletAddress: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { stakeAmountLamports: "desc" },
          take: 10,
        },
      } as unknown as Prisma.CommitmentSelect,
    })) as DbCommitmentDetailRecord | null;

    if (!record) return null;

    return mapCommitmentDetail({
      id: record.id,
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
          getDisplayName(comment.author as any),
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
          id: commitment.slug,
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
        id: true,
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
        id: record.id,
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