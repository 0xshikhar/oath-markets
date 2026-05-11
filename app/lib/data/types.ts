

export type ReactionCounts = {
  momentum: number;
  streak: number;
  watching: number;
  doubt: number;
  total: number;
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

export type CommitmentSummary = {
  id: string;
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
  isAtRisk: boolean;
  reactionCounts: ReactionCounts;
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
  believers: Array<{
    walletAddress: string;
    handle: string;
    avatarUrl: string | null;
    stakeLabel: string;
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

export type ExploreSort = "believers" | "recent" | "ending";

export type ExploreCommitmentFilters = {
  category?: string;
  search?: string;
  sort?: ExploreSort;
  limit?: number;
};

export type UserRecord = {
  walletAddress: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  worldIdVerified: boolean;
  notifyTime: string;
  timezone: string;
};

export type CommitmentRecord = {
  id: string;
  slug: string;
  onchainAddress?: string | null;
  title: string;
  description: string | null;
  category: string;
  proofType: string;
  coachTone?: string | null;
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

export type ProofRecord = {
  id: string;
  dayNumber: number;
  textContent: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  publicNote: string | null;
  createdAt: Date;
  reactionCounts?: ReactionCounts;
};

export type RawCommentRecord = {
  id: string;
  parentCommentId: string | null;
  authorName: string;
  content: string;
  createdAt: Date;
};

export type CoachMessageRecord = {
  content: string;
  createdAt: Date;
};

export type DbCommitmentSummaryRecord = {
  id: string;
  slug: string;
  onchainAddress: string | null;
  title: string;
  description: string | null;
  category: string;
  proofType: string;
  coachTone?: string | null;
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

export type DbProofRecord = {
  id: string;
  dayNumber: number;
  textContent: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  publicNote: string | null;
  createdAt: Date;
  reactionCounts?: ReactionCounts;
};

export type DbCommentRecord = {
  id: string;
  parentCommentId: string | null;
  content: string;
  createdAt: Date;
  author: {
    username: string | null;
    name: string | null;
    walletAddress: string;
  };
};

export type DbCoachMessageRecord = {
  content: string;
  createdAt: Date;
};

export type DbCommitmentDetailRecord = DbCommitmentSummaryRecord & {
  completionRatio: number | null;
  proofs: DbProofRecord[];
  comments: DbCommentRecord[];
  coachMessages: DbCoachMessageRecord[];
};

export type DbUserProfileRecord = UserRecord & {
  commitments: DbCommitmentSummaryRecord[];
  beliefs: { stakeAmountLamports: bigint }[];
  _count: {
    followers: number;
    following: number;
  };
};

export type DbCoachInboxMessageRecord = {
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