"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { Toaster } from "sonner";
import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClusterProvider } from "./cluster-context";
import { SolanaClientProvider } from "../lib/solana-client-context";
import { HAS_PRIVY_APP_ID, PRIVY_APP_ID, PRIVY_CLIENT_ID, createPrivyConfig } from "../lib/privy";
import { WalletProvider } from "../lib/wallet/context";

const privyConfig = createPrivyConfig();

function PrivyHydrationGate({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return <WalletProvider key="hydrating-wallet" mode="loading">{children}</WalletProvider>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      {...(PRIVY_CLIENT_ID ? { clientId: PRIVY_CLIENT_ID } : {})}
      config={privyConfig}
    >
      <WalletProvider key="privy-wallet" mode="privy">{children}</WalletProvider>
    </PrivyProvider>
  );
}

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ClusterProvider>
      {HAS_PRIVY_APP_ID ? (
        <PrivyHydrationGate key="privy-gate">
          <QueryClientProvider client={queryClient}>
            <SolanaClientProvider>{children}</SolanaClientProvider>
          </QueryClientProvider>
        </PrivyHydrationGate>
      ) : (
        <WalletProvider mode="loading" key="loading-gate">
          <QueryClientProvider client={queryClient}>
            <SolanaClientProvider>{children}</SolanaClientProvider>
          </QueryClientProvider>
        </WalletProvider>
      )}
      <Toaster key="app-toaster" position="bottom-right" richColors />
    </ClusterProvider>
  );
}
