"use client";

import { createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const DEVNET_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ??
  "https://api.devnet.solana.com";
const MAINNET_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC_URL?.trim() ??
  "https://api.mainnet-beta.solana.com";
const TESTNET_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_TESTNET_RPC_URL?.trim() ??
  "https://api.testnet.solana.com";
const LOCALNET_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_LOCALNET_RPC_URL?.trim() ??
  "http://localhost:8899";

function toWsUrl(url: string) {
  if (url.startsWith("https://")) {
    return `wss://${url.slice("https://".length)}`;
  }

  if (url.startsWith("http://")) {
    return `ws://${url.slice("http://".length)}`;
  }

  return url;
}

function createRpcConfig(url: string) {
  return {
    rpc: createSolanaRpc(url),
    rpcSubscriptions: createSolanaRpcSubscriptions(toWsUrl(url)),
  };
}

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ?? "";
export const PRIVY_CLIENT_ID =
  process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID?.trim() ?? "";
export const HAS_PRIVY_APP_ID = Boolean(PRIVY_APP_ID);

export function createPrivyConfig() {
  const solanaConnectors = toSolanaWalletConnectors({
    shouldAutoConnect: false,
  });

  return {
    appearance: {
      showWalletLoginFirst: true,
      walletChainType: "solana-only" as const,
    },
    loginMethods: ["wallet", "email"] as ("wallet" | "email")[],
    embeddedWallets: {
      solana: {
        createOnLogin: "users-without-wallets" as const,
      },
    },
    externalWallets: {
      solana: {
        connectors: solanaConnectors,
      },
    },
    solana: {
      rpcs: {
        "solana:devnet": createRpcConfig(DEVNET_RPC_URL),
        "solana:mainnet": createRpcConfig(MAINNET_RPC_URL),
        "solana:testnet": createRpcConfig(TESTNET_RPC_URL),
        "solana:localnet": createRpcConfig(LOCALNET_RPC_URL),
      },
    },
  };
}
