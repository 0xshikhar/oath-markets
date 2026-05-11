import type {
  ReactionCounts,
  CommentThreadNode,
  RawCommentRecord,
  UserRecord,
} from "./types";

const LAMPORTS_PER_SOL = 1_000_000_000n;

export function ellipsify(value: string, visible = 4) {
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

export function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatLongDateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatSol(lamports: bigint) {
  const whole = lamports / LAMPORTS_PER_SOL;
  const fraction = lamports % LAMPORTS_PER_SOL;

  if (fraction === 0n) return whole.toString();

  const decimals = fraction.toString().padStart(9, "0").replace(/0+$/, "");

  return decimals ? `${whole}.${decimals.slice(0, 2)}` : whole.toString();
}

export function emptyReactionCounts(): ReactionCounts {
  return {
    momentum: 0,
    streak: 0,
    watching: 0,
    doubt: 0,
    total: 0,
  };
}

export function toHandle(user: { username: string | null; walletAddress: string }) {
  return user.username ? `@${user.username}` : ellipsify(user.walletAddress, 4);
}

export function getDisplayName(user: UserRecord) {
  if (user.name) {
    return user.name;
  }

  if (user.username) {
    const name = user.username.split(".")[0];
    return name
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  return ellipsify(user.walletAddress, 4);
}

export function buildCommentThreads(records: RawCommentRecord[]) {
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