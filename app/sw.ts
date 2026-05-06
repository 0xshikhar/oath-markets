/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkOnly } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const networkOnly = new NetworkOnly();

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
  runtimeCaching: [
    {
      matcher: ({ url }) =>
        url.hostname === "auth.privy.io" ||
        url.hostname.endsWith(".privy.io") ||
        url.hostname.endsWith(".helius-rpc.com") ||
        url.hostname.endsWith(".solana.com") ||
        url.hostname === "api.cloudinary.com",
      handler: networkOnly,
    },
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/api/"),
      handler: networkOnly,
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
