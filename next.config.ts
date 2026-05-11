import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";
import withSerwistInit from "@serwist/next";

const rootDir = dirname(fileURLToPath(import.meta.url));

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "ws",
    "@privy-io/react-auth",
    "@privy-io/react-auth/solana",
    "@privy-io/js-sdk-core",
    "@walletconnect/logger",
    "@walletconnect/universal-provider",
    "@walletconnect/sign-client",
    "@walletconnect/ethereum-provider",
    "@reown/appkit",
    "pino",
    "thread-stream",
    "isows",
  ],
  turbopack: {},
};

export default withSerwist(nextConfig);