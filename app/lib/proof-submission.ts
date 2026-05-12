import { type Address } from "@solana/kit";
import { fetchCommitmentAccount } from "@/lib/generated/oath";

export async function getNextOnchainProofDay(
  rpc: Parameters<typeof fetchCommitmentAccount>[0],
  commitmentAccount: Address
) {
  const account = await fetchCommitmentAccount(rpc, commitmentAccount);
  const proofCount = Number(account.data.proofCount);

  return {
    proofCount,
    dayNumber: proofCount + 1,
  };
}