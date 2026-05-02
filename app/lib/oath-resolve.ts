import { type Address } from "@solana/kit";
import { findReputationPda, getResolveCommitmentInstructionAsync } from "@/lib/generated/oath";
import { prisma } from "@/lib/prisma";
import { createOathAuthorityClient } from "@/lib/oath-server";
import { getAuthoritySigner } from "@/lib/server-signer";

type ResolveTarget = {
  slug?: string;
};

type ResolveSummary = {
  scanned: number;
  resolved: number;
  skipped: number;
  errors: Array<{
    slug: string;
    reason: string;
  }>;
};

function isResolvable(commitment: {
  status: string;
  endDate: Date;
  onchainAddress: string | null;
}) {
  return (
    commitment.status === "ACTIVE" &&
    Boolean(commitment.onchainAddress) &&
    commitment.endDate.getTime() <= Date.now()
  );
}

function computeOutcome(input: {
  proofCount: number;
  requiredProofDays: number;
}) {
  const completionRatio =
    input.requiredProofDays > 0
      ? Math.min(input.proofCount / input.requiredProofDays, 1)
      : 0;

  return {
    completionRatio,
    status: completionRatio >= 1 ? "COMPLETED" : "FAILED",
  } as const;
}

export async function resolveCommitmentsOnChain(
  target: ResolveTarget = {},
): Promise<ResolveSummary> {
  const where = target.slug
    ? { slug: target.slug }
    : {
        status: "ACTIVE" as const,
        endDate: {
          lte: new Date(),
        },
        onchainAddress: {
          not: null,
        },
      };

  const commitments = await prisma.commitment.findMany({
    where,
    include: {
      maker: true,
    },
    orderBy: [{ endDate: "asc" }, { createdAt: "asc" }],
  });

  const summary: ResolveSummary = {
    scanned: commitments.length,
    resolved: 0,
    skipped: 0,
    errors: [],
  };

  if (commitments.length === 0) {
    return summary;
  }

  const authoritySigner = await getAuthoritySigner();
  const authorityClient = await createOathAuthorityClient();

  for (const commitment of commitments) {
    if (!isResolvable(commitment)) {
      summary.skipped += 1;
      continue;
    }

    try {
      const commitmentAccount = commitment.onchainAddress as Address;
      const reputation = await findReputationPda({
        maker: commitment.maker.walletAddress as Address,
      });

      const instruction = await getResolveCommitmentInstructionAsync({
        resolver: authoritySigner,
        commitmentAccount,
        maker: commitment.maker.walletAddress as Address,
        reputation: reputation[0],
        treasury: authoritySigner.address as Address,
      });

      const signature = await authorityClient.sendTransaction([instruction]);
      const outcome = computeOutcome({
        proofCount: commitment.proofCount,
        requiredProofDays: commitment.requiredProofDays,
      });

      await prisma.commitment.update({
        where: { id: commitment.id },
        data: {
          status: outcome.status,
          completionRatio: outcome.completionRatio,
          resolvedAt: new Date(),
          onchainTxSig: signature.context.signature,
        },
      });

      summary.resolved += 1;
    } catch (error) {
      summary.errors.push({
        slug: commitment.slug,
        reason: error instanceof Error ? error.message : "resolution failed",
      });
    }
  }

  return summary;
}
