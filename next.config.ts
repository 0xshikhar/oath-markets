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
  // @solana/kit-plugin-payer's browser bundle has a spurious `import 'fs'`
  // from the payerFromFile export. Stub it out for the client bundle.
  turbopack: {
    root: rootDir,
    resolveAlias: {
      fs: { browser: "./empty-module.js" },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    }
    return config;
  },
};

export default withSerwist(nextConfig);
