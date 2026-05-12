import { coachToneLabel } from "@/lib/coach-tone";
import {
  emptyReactionCounts,
  formatDateLabel,
  formatLongDateLabel,
  formatSol,
  getDisplayName,
  toHandle,
  buildCommentThreads,
} from "./formatters";
import type {
  CommitmentRecord,
  CommitmentSummary,
  CommitmentDetail,
  DbCommitmentSummaryRecord,
  DbCommitmentDetailRecord,
  ExploreCommitmentFilters,
} from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function mapCommitment(commitment: CommitmentRecord): CommitmentSummary {
  const coachTone = commitment.coachTone ?? "SUPPORTIVE_FRIEND";
  const now = Date.now();
  const daysRemaining = Math.max(
    Math.ceil((commitment.endDate.getTime() - now) / DAY_MS),
    0
  );
  const progressPercent = Math.min(
    100,
    Math.round((commitment.proofCount / commitment.totalDays) * 100)
  );

  const isAtRisk = commitment.status === "ACTIVE" && (daysRemaining > 0) && (commitment.proofCount < (commitment.totalDays - daysRemaining));
  
  return {
    id: commitment.id,
    slug: commitment.slug,
    onchainAddress: commitment.onchainAddress ?? null,
    isPublic: commitment.isPublic,
    title: commitment.title,
    description: commitment.description ?? "",
    category: commitment.category,
    proofType: commitment.proofType,
    coachTone,
    coachToneLabel: coachToneLabel(coachTone),
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
    isAtRisk,
    reactionCounts: emptyReactionCounts(),
  };
}

export function mapCommitmentDetail(commitment: CommitmentRecord): CommitmentDetail {
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
    believers: (commitment as any).beliefs?.map((belief: any) => ({
      walletAddress: belief.believer.walletAddress,
      handle: toHandle(belief.believer),
      avatarUrl: belief.believer.avatarUrl,
      stakeLabel: `${formatSol(belief.stakeAmountLamports)} SOL`,
    })) ?? [],
    comments: buildCommentThreads(commitment.comments),
    coachMessages: commitment.coachMessages.map((message) => ({
      content: message.content,
      createdAtLabel: formatDateLabel(message.createdAt),
    })),
  };
}

export function sortFeaturedCommitments(commitments: CommitmentSummary[]) {
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

export function filterExploreCommitments(
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

export function mapDbToCommitmentSummary(record: DbCommitmentSummaryRecord): CommitmentSummary {
  return mapCommitment({
    id: record.slug,
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
  });
}