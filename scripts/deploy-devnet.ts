import { createKeyPairSignerFromBytes } from "@solana/kit";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getAuthorityPrivateKeyBytes } from "../app/lib/private-key";
import { loadEnvFile } from "./load-env";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const anchorDir = resolve(repoRoot, "anchor");
const walletPath = resolve(process.env.DEPLOY_WALLET ?? "/tmp/oath-devnet-wallet.json");
const minDeployBalanceSol = 3;
const topUpAmountSol = 2;

function runSolana(args: string[], capture = false) {
  return execFileSync("solana", args, {
    env: {
      ...process.env,
      NO_DNA: "1",
    },
    encoding: capture ? "utf8" : undefined,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
}

function getDevnetBalanceSol() {
  const output = String(runSolana(["balance", walletPath, "--url", "devnet"], true));
  const match = output.match(/([0-9]+(?:\.[0-9]+)?)\s+SOL/);
  if (!match) {
    throw new Error(`Unable to parse devnet balance from: ${output.trim()}`);
  }

  return Number(match[1]);
}

function ensureDevnetFunds() {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const balance = getDevnetBalanceSol();
    if (balance >= minDeployBalanceSol) {
      console.log(`Devnet balance: ${balance.toFixed(8)} SOL`);
      return;
    }

    console.log(
      `Devnet balance is ${balance.toFixed(8)} SOL; requesting ${topUpAmountSol} SOL airdrop (attempt ${attempt}/3)`
    );
    try {
      runSolana(["airdrop", String(topUpAmountSol), "--url", "devnet", "--keypair", walletPath]);
    } catch (error) {
      throw new Error(
        `Unable to airdrop devnet SOL for ${walletPath}. The devnet faucet is likely rate-limited or unavailable. Fund this wallet manually, wait, and rerun the deploy script. ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  const finalBalance = getDevnetBalanceSol();
  if (finalBalance < minDeployBalanceSol) {
    throw new Error(
      `Devnet balance is still only ${finalBalance.toFixed(8)} SOL; fund ${walletPath} manually and rerun.`
    );
  }
}

function run(command: string, args: string[], cwd: string) {
  execFileSync(command, args, {
    cwd,
    env: {
      ...process.env,
      NO_DNA: "1",
      ANCHOR_WALLET: walletPath,
      DEPLOY_WALLET: walletPath,
    },
    stdio: "inherit",
  });
}

async function main() {
  loadEnvFile(resolve(repoRoot, ".env"));

  const privateKeyBytes = getAuthorityPrivateKeyBytes();
  const signer = await createKeyPairSignerFromBytes(privateKeyBytes);
  writeFileSync(walletPath, JSON.stringify(Array.from(privateKeyBytes)));

  console.log(`Using deploy wallet: ${signer.address}`);
  console.log(`Wallet file: ${walletPath}`);
  ensureDevnetFunds();

  run("anchor", ["build"], anchorDir);
  run("anchor", ["deploy", "--provider.cluster", "devnet", "--provider.wallet", walletPath], anchorDir);
  run("jiti", ["scripts/devnet-smoke.ts"], repoRoot);
  run("jiti", ["scripts/devnet-resolve-smoke.ts"], repoRoot);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
