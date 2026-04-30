import { createEmptyClient } from "@solana/kit";
import { rpc } from "@solana/kit-plugin-rpc";
import {
  fetchCommitmentAccount,
  OATH_PROGRAM_ADDRESS,
  type CommitmentAccount as OathCommitmentAccount,
} from "@/lib/generated/oath";
import { prisma } from "@/lib/prisma";

type HeliusWebhookEnvelope = Record<string, unknown> & {
  signature?: string;
  transactionSignature?: string;
  transaction?: {
    signatures?: string[];
  };
  events?: HeliusWebhookEvent[];
  type?: string;
  data?: unknown;
};

type HeliusWebhookEvent = Record<string, unknown> & {
  type?: string;
  data?: unknown;
};

type SyncSummary = {
  received: number;
  applied: number;
  skipped: number;
  details: Array<{
    type: string;
    commitmentSlug?: string;
    txSig?: string;
    status: "applied" | "skipped";
    reason?: string;
  }>;
};

type ReconcileSummary = {
  scanned: number;
  applied: number;
  skipped: number;
  errors: Array<{
    commitmentSlug: string;
    reason: string;
  }>;
};

const HELIUS_RPC_URL = process.env.HELIUS_API_KEY
  ? `https://rpc.helius.xyz/?api-key=${process.env.HELIUS_API_KEY}`
  : null;

const CommitmentStatus = {
  ACTIVE: "ACTIVE",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  ABANDONED: "ABANDONED",
} as const;

const BeliefStatus = {
  ACTIVE: "ACTIVE",
  WON: "WON",
  LOST: "LOST",
} as const;

const SlashDest = {
  BURN: "BURN",
  DONATE: "DONATE",
  TREASURY: "TREASURY",
} as const;

function createHeliusRpcClient() {
  if (!HELIUS_RPC_URL) {
    throw new Error("HELIUS_API_KEY is required for on-chain reconciliation");
  }

  return createEmptyClient().use(rpc(HELIUS_RPC_URL));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const result = readString(value);
    if (result) return result;
  }

  return undefined;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "bigint") {
      return Number(value);
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return undefined;
}

function firstBigInt(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "bigint") return value;

    if (typeof value === "number" && Number.isFinite(value)) {
      return BigInt(Math.trunc(value));
    }

    if (typeof value === "string" && value.trim() !== "") {
      try {
        return BigInt(value);
      } catch {
        continue;
      }
    }
  }

  return undefined;
}

function normalizeHash(value: unknown) {
  if (!value) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    return `0x${Buffer.from(value.filter((item): item is number => typeof item === "number")).toString("hex")}`;
  }

  if (value instanceof Uint8Array) {
    return `0x${Buffer.from(value).toString("hex")}`;
  }

  if (isRecord(value) && Array.isArray(value.data)) {
    return `0x${Buffer.from(value.data.filter((item): item is number => typeof item === "number")).toString("hex")}`;
  }

  return undefined;
}

function normalizeEventType(value: unknown) {
  const raw = readString(value);
  if (!raw) return undefined;

  const normalized = raw.toLowerCase().replace(/[^a-z0-9]+/g, "");
  switch (normalized) {
    case "commitmentcreated":
    case "createcommitment":
    case "createdcommitment":
      return "CommitmentCreated";
    case "proofsubmitted":
    case "submitproof":
    case "submittedproof":
      return "ProofSubmitted";
    case "beliefstaked":
    case "costakebelief":
    case "stakebelief":
      return "BeliefStaked";
    case "commitmentresolved":
    case "resolvecommitment":
      return "CommitmentResolved";
    default:
      return raw;
  }
}

function expandWebhookPayload(payload: unknown): HeliusWebhookEnvelope[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord) as HeliusWebhookEnvelope[];
  }

  if (!isRecord(payload)) {
    return [];
  }

  if (Array.isArray(payload.transactions)) {
    return payload.transactions.filter(isRecord) as HeliusWebhookEnvelope[];
  }

  if (Array.isArray(payload.events)) {
    return [payload as HeliusWebhookEnvelope];
  }

  return [payload as HeliusWebhookEnvelope];
}

function extractEnvelopeEvents(envelope: HeliusWebhookEnvelope) {
  if (Array.isArray(envelope.events) && envelope.events.length > 0) {
    return envelope.events.filter(isRecord) as HeliusWebhookEvent[];
  }

  if (envelope.type) {
    return [
      {
        type: envelope.type,
        data: envelope.data,
      } satisfies HeliusWebhookEvent,
    ];
  }

  return [];
}

function extractTxSignature(envelope: HeliusWebhookEnvelope, event?: HeliusWebhookEvent) {
  return firstString(
    event?.signature,
    envelope.signature,
    envelope.transactionSignature,
    envelope.transaction?.signatures?.[0],
    event?.transactionSignature,
  );
}

function extractCommitmentAddress(data: unknown) {
  if (!isRecord(data)) return undefined;

  return firstString(
    data.commitmentAddress,
    data.commitmentAccount,
    data.commitment,
    data.commitment_account,
    data.account,
    data.address,
  );
}

function extractWalletAddress(data: unknown) {
  if (!isRecord(data)) return undefined;

  return firstString(data.walletAddress, data.maker, data.believer, data.user, data.owner);
}

function extractProofDayNumber(data: unknown, fallback?: number) {
  if (!isRecord(data)) return fallback;

  return firstNumber(data.dayNumber, data.day_number, data.day, fallback) ?? fallback;
}

function extractProofCount(data: unknown) {
  if (!isRecord(data)) return undefined;

  return firstNumber(data.proofCount, data.proof_count, data.count);
}

function extractCompletionRatio(data: unknown) {
  if (!isRecord(data)) return undefined;

  return firstNumber(data.completionRatio, data.completion_ratio, data.ratio);
}

function extractTimestamp(data: unknown) {
  if (!isRecord(data)) return undefined;

  return firstBigInt(data.timestamp, data.resolvedAt, data.resolved_at, data.submittedAt, data.submitted_at);
}

function toDateFromUnixSeconds(value: bigint | number | undefined) {
  if (value === undefined) return undefined;

  const numeric = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;
  return new Date(numeric * 1000);
}

function mapCommitmentStatus(value: OathCommitmentAccount["status"]) {
  switch (value) {
    case 0:
      return CommitmentStatus.ACTIVE;
    case 1:
      return CommitmentStatus.COMPLETED;
    case 2:
      return CommitmentStatus.FAILED;
    case 3:
      return CommitmentStatus.ABANDONED;
    default:
      return CommitmentStatus.ACTIVE;
  }
}

function mapSlashDestination(value: OathCommitmentAccount["slashDestination"]) {
  switch (value) {
    case 0:
      return SlashDest.BURN;
    case 1:
      return SlashDest.DONATE;
    case 2:
      return SlashDest.TREASURY;
    default:
      return SlashDest.TREASURY;
  }
}

function mapBeliefStatus(value: unknown) {
  const normalized = typeof value === "number" ? value : undefined;
  switch (normalized) {
    case 0:
      return BeliefStatus.ACTIVE;
    case 1:
      return BeliefStatus.WON;
    case 2:
      return BeliefStatus.LOST;
    default:
      return BeliefStatus.ACTIVE;
  }
}

async function resolveCommitmentRecord(tx: typeof prisma, data: unknown, txSig?: string) {
  const commitmentAddress = extractCommitmentAddress(data);
  const candidates: Array<{ onchainAddress?: string; onchainTxSig?: string }> = [];

  if (commitmentAddress) {
    candidates.push({ onchainAddress: commitmentAddress });
  }

  if (txSig) {
    candidates.push({ onchainTxSig: txSig });
  }

  const commitment = await tx.commitment.findFirst({
    where: {
      OR: candidates,
    },
    include: {
      maker: true,
    },
  });

  return { commitment, commitmentAddress };
}

async function syncCommitmentCreated(data: unknown, txSig?: string) {
  const { commitment } = await resolveCommitmentRecord(prisma, data, txSig);
  if (!commitment) {
    return { applied: false, reason: "commitment not found" };
  }

  const proofCount = extractProofCount(data);
  const completionRatio = extractCompletionRatio(data);
  const timestamp = extractTimestamp(data);
  const resolvedAt = toDateFromUnixSeconds(timestamp);
  const isResolved = Boolean(resolvedAt);

  await prisma.commitment.update({
    where: { id: commitment.id },
    data: {
      onchainTxSig: txSig ?? commitment.onchainTxSig,
      proofCount: proofCount ?? commitment.proofCount,
      completionRatio: completionRatio ?? commitment.completionRatio,
      resolvedAt: resolvedAt ?? commitment.resolvedAt,
      status:
        isResolved && (completionRatio ?? 0) >= 1
          ? CommitmentStatus.COMPLETED
          : isResolved
            ? CommitmentStatus.FAILED
            : commitment.status,
    },
  });

  return { applied: true, commitmentSlug: commitment.slug };
}

async function syncProofSubmitted(data: unknown, txSig?: string) {
  const dayNumber = extractProofDayNumber(data);
  const commitmentLookup = await resolveCommitmentRecord(prisma, data, txSig);
  const commitment = commitmentLookup.commitment;
  if (!commitment || dayNumber === undefined) {
    return { applied: false, reason: commitment ? "day number missing" : "commitment not found" };
  }

  const contentHash = normalizeHash(
    isRecord(data)
      ? data.contentHash ?? data.content_hash ?? data.hash ?? data.proofHash
      : undefined,
  );
  const proofTimestamp = extractTimestamp(data);
  const submittedAt = toDateFromUnixSeconds(proofTimestamp) ?? new Date();
  const existing = await prisma.proof.findUnique({
    where: {
      commitmentId_dayNumber: {
        commitmentId: commitment.id,
        dayNumber,
      },
    },
  });

  if (existing) {
    const textContent = isRecord(data) ? readString(data.textContent ?? data.text_content) : undefined;
    const imageUrl = isRecord(data) ? readString(data.imageUrl ?? data.image_url) : undefined;
    const linkUrl = isRecord(data) ? readString(data.linkUrl ?? data.link_url) : undefined;
    const publicNote = isRecord(data)
      ? readString(data.publicNote ?? data.public_note)
      : undefined;

    await prisma.proof.update({
      where: { id: existing.id },
      data: {
        textContent: textContent ?? existing.textContent,
        imageUrl: imageUrl ?? existing.imageUrl,
        linkUrl: linkUrl ?? existing.linkUrl,
        contentHash: contentHash ?? existing.contentHash,
        onchainTxSig: txSig ?? existing.onchainTxSig,
        publicNote: publicNote ?? existing.publicNote,
      },
    });
  } else {
    await prisma.proof.create({
      data: {
        commitmentId: commitment.id,
        dayNumber,
        textContent: readString(isRecord(data) ? data.textContent ?? data.text_content : undefined) ?? null,
        imageUrl: readString(isRecord(data) ? data.imageUrl ?? data.image_url : undefined) ?? null,
        linkUrl: readString(isRecord(data) ? data.linkUrl ?? data.link_url : undefined) ?? null,
        contentHash: contentHash ?? null,
        onchainTxSig: txSig ?? null,
        publicNote: readString(isRecord(data) ? data.publicNote ?? data.public_note : undefined) ?? null,
        createdAt: submittedAt,
      },
    });
  }

  const proofCount = await prisma.proof.count({
    where: { commitmentId: commitment.id },
  });

  await prisma.commitment.update({
    where: { id: commitment.id },
    data: {
      proofCount,
      onchainTxSig: txSig ?? commitment.onchainTxSig,
    },
  });

  return { applied: true, commitmentSlug: commitment.slug };
}

async function syncBeliefStaked(data: unknown, txSig?: string) {
  const commitmentLookup = await resolveCommitmentRecord(prisma, data, txSig);
  const commitment = commitmentLookup.commitment;
  const believerAddress = extractWalletAddress(data);

  if (!commitment || !believerAddress) {
    return {
      applied: false,
      reason: commitment ? "believer address missing" : "commitment not found",
    };
  }

  const user = await prisma.user.upsert({
    where: { walletAddress: believerAddress },
    create: { walletAddress: believerAddress },
    update: {},
  });

  const stakeAmountLamports = firstBigInt(
    isRecord(data) ? data.stakeLamports : undefined,
    isRecord(data) ? data.stake_lamports : undefined,
    isRecord(data) ? data.stakeAmountLamports : undefined,
    isRecord(data) ? data.stakeAmountLamports : undefined,
  );

  const believerRecord = await prisma.belief.upsert({
    where: {
      commitmentId_believerId: {
        commitmentId: commitment.id,
        believerId: user.id,
      },
    },
    create: {
      commitmentId: commitment.id,
      believerId: user.id,
      stakeAmountLamports: stakeAmountLamports ?? 0n,
      onchainAddress:
        readString(isRecord(data) ? data.believerRecord ?? data.believer_record : undefined) ?? null,
      onchainTxSig: txSig ?? "",
    },
    update: {
      stakeAmountLamports: stakeAmountLamports ?? undefined,
      onchainAddress:
        readString(isRecord(data) ? data.believerRecord ?? data.believer_record : undefined) ?? undefined,
      onchainTxSig: txSig ?? undefined,
      status: mapBeliefStatus(isRecord(data) ? data.status : undefined),
    },
  });

  await prisma.belief.update({
    where: { id: believerRecord.id },
    data: {
      status: mapBeliefStatus(isRecord(data) ? data.status : undefined),
      onchainTxSig: txSig ?? believerRecord.onchainTxSig,
    },
  });

  return { applied: true, commitmentSlug: commitment.slug };
}

async function syncCommitmentResolved(data: unknown, txSig?: string) {
  const { commitment } = await resolveCommitmentRecord(prisma, data, txSig);
  if (!commitment) {
    return { applied: false, reason: "commitment not found" };
  }

  const completionRatio = extractCompletionRatio(data);
  const resolvedAt = toDateFromUnixSeconds(extractTimestamp(data)) ?? new Date();
  const status =
    completionRatio !== undefined && completionRatio >= 1
      ? CommitmentStatus.COMPLETED
      : CommitmentStatus.FAILED;

  await prisma.commitment.update({
    where: { id: commitment.id },
    data: {
      completionRatio: completionRatio ?? commitment.completionRatio,
      resolvedAt,
      status,
      onchainTxSig: txSig ?? commitment.onchainTxSig,
    },
  });

  return { applied: true, commitmentSlug: commitment.slug };
}

async function syncHeliusEvent(envelope: HeliusWebhookEnvelope, event: HeliusWebhookEvent) {
  const txSig = extractTxSignature(envelope, event);
  const canonicalType = normalizeEventType(event.type ?? envelope.type);
  const data = isRecord(event.data) ? event.data : isRecord(event) ? event : envelope;

  switch (canonicalType) {
    case "CommitmentCreated":
      return {
        type: canonicalType,
        txSig,
        ...(await syncCommitmentCreated(data, txSig)),
      };
    case "ProofSubmitted":
      return {
        type: canonicalType,
        txSig,
        ...(await syncProofSubmitted(data, txSig)),
      };
    case "BeliefStaked":
      return {
        type: canonicalType,
        txSig,
        ...(await syncBeliefStaked(data, txSig)),
      };
    case "CommitmentResolved":
      return {
        type: canonicalType,
        txSig,
        ...(await syncCommitmentResolved(data, txSig)),
      };
    default:
      return {
        type: canonicalType ?? "Unknown",
        txSig,
        applied: false,
        reason: "unsupported event type",
      };
  }
}

export async function syncHeliusWebhookPayload(payload: unknown): Promise<SyncSummary> {
  const envelopes = expandWebhookPayload(payload);
  const summary: SyncSummary = {
    received: 0,
    applied: 0,
    skipped: 0,
    details: [],
  };

  for (const envelope of envelopes) {
    const events = extractEnvelopeEvents(envelope);
    if (events.length === 0) {
      summary.received += 1;
      summary.skipped += 1;
      summary.details.push({
        type: "Unknown",
        txSig: extractTxSignature(envelope),
        status: "skipped",
        reason: "no event payload found",
      });
      continue;
    }

    for (const event of events) {
      summary.received += 1;
      try {
        const result = await syncHeliusEvent(envelope, event);
        if (result.applied) {
          summary.applied += 1;
          summary.details.push({
            type: result.type,
            commitmentSlug: "commitmentSlug" in result ? result.commitmentSlug : undefined,
            txSig: result.txSig,
            status: "applied",
          });
        } else {
          summary.skipped += 1;
          summary.details.push({
            type: result.type,
            txSig: result.txSig,
            status: "skipped",
            reason: result.reason ?? "unhandled event",
          });
        }
      } catch (error) {
        summary.skipped += 1;
        summary.details.push({
          type: normalizeEventType(event.type ?? envelope.type) ?? "Unknown",
          txSig: extractTxSignature(envelope, event),
          status: "skipped",
          reason: error instanceof Error ? error.message : "sync failed",
        });
      }
    }
  }

  return summary;
}

export async function reconcileCommitmentsFromChain(): Promise<ReconcileSummary> {
  if (!HELIUS_RPC_URL) {
    throw new Error("HELIUS_API_KEY is required for on-chain reconciliation");
  }

  const rpcClient = createHeliusRpcClient();
  const commitments = await prisma.commitment.findMany({
    where: {
      onchainAddress: {
        not: null,
      },
    },
    select: {
      id: true,
      slug: true,
      onchainAddress: true,
    },
  });

  const summary: ReconcileSummary = {
    scanned: commitments.length,
    applied: 0,
    skipped: 0,
    errors: [],
  };

  for (const commitment of commitments) {
    if (!commitment.onchainAddress) {
      summary.skipped += 1;
      continue;
    }

    try {
      const onchain = await fetchCommitmentAccount(
        rpcClient.rpc as Parameters<typeof fetchCommitmentAccount>[0],
        commitment.onchainAddress as typeof OATH_PROGRAM_ADDRESS,
      );

      const resolvedAt = toDateFromUnixSeconds(onchain.data.resolvedAt);
      await prisma.commitment.update({
        where: { id: commitment.id },
        data: {
          proofCount: onchain.data.proofCount,
          status: mapCommitmentStatus(onchain.data.status),
          completionRatio:
            onchain.data.totalDays > 0
              ? onchain.data.proofCount / onchain.data.requiredProofDays
              : null,
          resolvedAt,
          slashDestination: mapSlashDestination(onchain.data.slashDestination),
        },
      });

      summary.applied += 1;
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push({
        commitmentSlug: commitment.slug,
        reason: error instanceof Error ? error.message : "failed to reconcile commitment",
      });
    }
  }

  return summary;
}

export function getHeliusProgramAddress() {
  return OATH_PROGRAM_ADDRESS;
}
