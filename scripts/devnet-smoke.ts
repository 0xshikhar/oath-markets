import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createKeyPairSignerFromBytes } from "@solana/kit";
import { createClient } from "@solana/kit-client-rpc";

import {
  SlashDestination,
  fetchCommitmentAccount,
  findCommitmentAccountPda,
  getCreateCommitmentInstructionAsync,
} from "../app/lib/generated/oath";
import { loadEnvFile } from "./load-env";

const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const DEFAULT_WALLET_PATH = "/tmp/oath-devnet-wallet.json";

async function main() {
  loadEnvFile(resolve(process.cwd(), ".env"));

  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() || DEFAULT_RPC_URL;
  const walletPath = resolve(process.env.DEPLOY_WALLET ?? DEFAULT_WALLET_PATH);
  const secretKeyBytes = JSON.parse(readFileSync(walletPath, "utf8")) as number[];

  if (!Array.isArray(secretKeyBytes) || secretKeyBytes.length !== 64) {
    throw new Error(`Expected 64 secret key bytes in ${walletPath}`);
  }

  const signer = await createKeyPairSignerFromBytes(Uint8Array.from(secretKeyBytes));
  const client = createClient({
    url: rpcUrl,
    payer: signer,
  });

  const commitmentId = randomBytes(32);
  const totalDays = 7;
  const requiredProofDays = 7;
  const startTimestamp = Math.floor(Date.now() / 1000);
  const endTimestamp = startTimestamp + totalDays * 24 * 60 * 60;
  const stakeLamports = 100_000_000n;
  const [commitmentAddress] = await findCommitmentAccountPda({
    maker: signer.address,
    commitmentId,
  });

  const instruction = await getCreateCommitmentInstructionAsync({
    maker: signer,
    commitmentId,
    totalDays,
    requiredProofDays,
    startTimestamp,
    endTimestamp,
    stakeLamports,
    slashDestination: SlashDestination.Treasury,
    isPublic: true,
  });

  const result = await client.sendTransaction([instruction]);
  const commitment = await fetchCommitmentAccount(client.rpc, commitmentAddress);

  if (commitment.data.maker !== signer.address) {
    throw new Error("Smoke test failed: maker mismatch");
  }

  if (commitment.data.stakeLamports !== stakeLamports) {
    throw new Error("Smoke test failed: stake mismatch");
  }

  if (commitment.data.totalDays !== totalDays) {
    throw new Error("Smoke test failed: duration mismatch");
  }

  console.log(
    JSON.stringify(
      {
        signature: result.context.signature,
        commitmentAddress,
        maker: signer.address,
        stakeLamports: commitment.data.stakeLamports.toString(),
        totalDays: commitment.data.totalDays,
        requiredProofDays: commitment.data.requiredProofDays,
        isPublic: commitment.data.isPublic,
        status: commitment.data.status,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
