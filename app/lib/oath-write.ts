import type { Instruction } from "@solana/kit";
import type { ClusterMoniker, SolanaClient } from "./solana-client";
import { isOathProgramAvailable, getOathProgramUnavailableMessage } from "./oath-program";

type SendInstruction = (input: {
  instructions: readonly Instruction[];
}) => Promise<string>;

export async function sendOathInstructionBestEffort(input: {
  cluster: ClusterMoniker;
  solanaClient: Pick<SolanaClient, "rpc">;
  send: SendInstruction;
  instruction: Instruction;
}): Promise<string> {
  const oathProgramAvailable = await isOathProgramAvailable(
    input.solanaClient,
  );

  if (!oathProgramAvailable) {
    throw new Error(getOathProgramUnavailableMessage(input.cluster));
  }

  try {
    return await input.send({ instructions: [input.instruction] });
  } catch (error) {
    if (error instanceof Error && error.message === "Transaction was rejected by the wallet.") {
      throw error;
    }

    throw new Error(
      error instanceof Error ? error.message : "On-chain transaction failed"
    );
  }
}
