import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createKeyPairSignerFromBytes, type Address } from "@solana/kit";
import { createClient } from "@solana/kit-client-rpc";

import {
  CommitmentStatus,
  SlashDestination,
  fetchCommitmentAccount,
  findCommitmentAccountPda,
  findReputationPda,
  getCreateCommitmentInstructionAsync,
  getResolveCommitmentInstructionAsync,
} from "../app/lib/generated/oath";
import { loadEnvFile } from "./load-env";

const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const DEFAULT_WALLET_PATH = "/tmp/oath-devnet-wallet.json";
const DAY_SECONDS = 24 * 60 * 60;

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
  const now = Math.floor(Date.now() / 1000);
  const startTimestamp = now - 2 * DAY_SECONDS;
  const endTimestamp = now - DAY_SECONDS;
  const stakeLamports = 100_000_000n;
  const [commitmentAddress] = await findCommitmentAccountPda({
    maker: signer.address,
    commitmentId,
  });

  const createInstruction = await getCreateCommitmentInstructionAsync({
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

  const createResult = await client.sendTransaction([createInstruction]);
  let commitment = await fetchCommitmentAccount(client.rpc, commitmentAddress);

  if (commitment.data.maker !== signer.address) {
    throw new Error("Resolver smoke failed: maker mismatch after create");
  }

  if (commitment.data.status !== CommitmentStatus.Active) {
    throw new Error("Resolver smoke failed: commitment should be active after create");
  }

  if (commitment.data.resolvedAt !== 0n) {
    throw new Error("Resolver smoke failed: commitment resolved too early");
  }

  const [reputationAddress] = await findReputationPda({
    maker: signer.address as Address,
  });

  const resolveInstruction = await getResolveCommitmentInstructionAsync({
    resolver: signer,
    commitmentAccount: commitmentAddress,
    maker: signer.address,
    reputation: reputationAddress,
    treasury: signer.address,
  });

  const resolveResult = await client.sendTransaction([resolveInstruction]);
  commitment = await fetchCommitmentAccount(client.rpc, commitmentAddress);

  if (commitment.data.status !== CommitmentStatus.Failed) {
    throw new Error("Resolver smoke failed: expected failed status after resolution");
  }

  if (commitment.data.resolvedAt === 0n) {
    throw new Error("Resolver smoke failed: commitment was not marked resolved");
  }

  console.log(
    JSON.stringify(
      {
        createSignature: createResult.context.signature,
        resolveSignature: resolveResult.context.signature,
        commitmentAddress,
        maker: signer.address,
        treasury: signer.address,
        stakeLamports: commitment.data.stakeLamports.toString(),
        status: commitment.data.status,
        resolvedAt: commitment.data.resolvedAt.toString(),
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
