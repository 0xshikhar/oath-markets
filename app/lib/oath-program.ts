import { fetchEncodedAccount } from "@solana/kit";
import { OATH_PROGRAM_ADDRESS } from "@/lib/generated/oath";
import type { ClusterMoniker, SolanaClient } from "./solana-client";

type OathRpcClient = Pick<SolanaClient, "rpc">;

export async function isOathProgramAvailable(client: OathRpcClient) {
  const programAccount = await fetchEncodedAccount(client.rpc, OATH_PROGRAM_ADDRESS);
  return programAccount.exists;
}

export function getOathProgramUnavailableMessage(cluster: ClusterMoniker) {
  return `The OATH program is not deployed on ${cluster}. This action was saved off-chain only.`;
}

export function getOathProgramMissingErrorMessage(cluster: ClusterMoniker | string) {
  return `The OATH program is not deployed on ${cluster}. Deploy the program there or switch to a cluster where it exists.`;
}
