"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  useSignAndSendTransaction,
  useWallets,
  type PrivyStandardWallet,
  type ConnectedStandardSolanaWallet,
} from "@privy-io/react-auth/solana";
import {
  address,
  getAddressEncoder,
  isAddress,
  signatureBytes,
  type Address,
  type TransactionSigner,
} from "@solana/kit";
import { createWalletSigner } from "./signer";
import type {
  WalletAccount,
  WalletConnectorMetadata,
  WalletSession,
} from "./types";

const STORAGE_KEY = "oath:selected-solana-wallet";

const WALLET_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
} as const;

type WalletStatus = (typeof WALLET_STATUS)[keyof typeof WALLET_STATUS];
type WalletMode = "privy" | "loading";
type WalletKind = "embedded" | "external";

type ManagedWallet = WalletSession & {
  kind: WalletKind;
  isEmbedded: boolean;
  rawWallet?: ConnectedStandardSolanaWallet;
};

type WalletContextValue = {
  mode: WalletMode;
  wallets: ManagedWallet[];
  wallet: ManagedWallet | undefined;
  activeWalletAddress: Address | undefined;
  setActiveWalletAddress: (next: Address | undefined) => void;
  signer: TransactionSigner | undefined;
  status: WalletStatus;
  error: unknown;
  isReady: boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function createDisconnectedValue(mode: WalletMode): WalletContextValue {
  return {
    mode,
    wallets: [],
    wallet: undefined,
    activeWalletAddress: undefined,
    setActiveWalletAddress: () => {
      /* disconnected fallback */
    },
    signer: undefined,
    status: WALLET_STATUS.DISCONNECTED,
    error: undefined,
    isReady: true,
  };
}

function isPrivyEmbeddedWallet(wallet: ConnectedStandardSolanaWallet) {
  const standardWallet = wallet.standardWallet as Partial<PrivyStandardWallet> & {
    name?: string;
  };

  return Boolean(
    standardWallet.isPrivyWallet ??
      String(standardWallet.name ?? "").toLowerCase().includes("privy")
  );
}

function createWalletAccount(
  addressValue: Address,
  label?: string
): WalletAccount {
  return {
    address: addressValue,
    publicKey: new Uint8Array(getAddressEncoder().encode(addressValue)),
    label,
  };
}

function readStoredAddress() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored && isAddress(stored) ? address(stored) : undefined;
}

function WalletProviderImpl({
  children,
  mode,
}: PropsWithChildren<{ mode: WalletMode }>) {
  const { authenticated, ready: privyReady, logout } = usePrivy();
  const { wallets: connectedWallets, ready: solanaReady } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const providerReady = privyReady && solanaReady;
  const [selectedWalletAddress, setSelectedWalletAddressState] = useState<
    Address | undefined
  >(() => readStoredAddress());

  const liveWallets = useMemo<ManagedWallet[]>(() => {
    return connectedWallets.map((connectedWallet) => {
      const walletAddress = address(connectedWallet.address);
      const isEmbedded = isPrivyEmbeddedWallet(connectedWallet);
      const connectorName = String(
        connectedWallet.standardWallet?.name ?? "Solana wallet"
      );

      return {
        account: createWalletAccount(walletAddress, connectorName),
        connector: {
          id: walletAddress,
          name: connectorName,
        } satisfies WalletConnectorMetadata,
        kind: isEmbedded ? "embedded" : "external",
        isEmbedded,
        rawWallet: connectedWallet,
        disconnect: async () => {
          try {
            connectedWallet.disconnect();
          } finally {
            setSelectedWalletAddressState(undefined);
            await logout();
          }
        },
        sendTransaction: async (transaction) => {
          const result = await signAndSendTransaction({
            transaction,
            wallet: connectedWallet,
          });
          return signatureBytes(result.signature);
        },
      };
    });
  }, [connectedWallets, logout, signAndSendTransaction]);

  const wallets = useMemo<ManagedWallet[]>(() => {
    return authenticated ? liveWallets : [];
  }, [authenticated, liveWallets]);

  const resolvedWalletAddress = useMemo(() => {
    if (!authenticated) {
      return undefined;
    }

    if (
      selectedWalletAddress &&
      liveWallets.some((wallet) => wallet.account.address === selectedWalletAddress)
    ) {
      return selectedWalletAddress;
    }

    return (
      liveWallets.find((wallet) => wallet.kind === "embedded")?.account.address ??
      liveWallets[0]?.account.address
    );
  }, [authenticated, liveWallets, selectedWalletAddress]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (selectedWalletAddress) {
      window.localStorage.setItem(STORAGE_KEY, String(selectedWalletAddress));
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
  }, [selectedWalletAddress]);

  const wallet = useMemo(() => {
    if (!resolvedWalletAddress) {
      return undefined;
    }

    return (
      liveWallets.find((entry) => entry.account.address === resolvedWalletAddress) ??
      liveWallets[0]
    );
  }, [liveWallets, resolvedWalletAddress]);

  const signer = useMemo<TransactionSigner | undefined>(() => {
    const rawWallet = wallet?.rawWallet;
    if (!wallet || !rawWallet) {
      return undefined;
    }

    return createWalletSigner(
      {
        account: wallet.account,
        connector: wallet.connector,
        disconnect: wallet.disconnect,
        signTransaction: async (transaction: Uint8Array) => {
          const result = await rawWallet.signTransaction({ transaction });
          return new Uint8Array(result.signedTransaction);
        },
        sendTransaction: async (transaction: Uint8Array) => {
          const result = await signAndSendTransaction({
            transaction,
            wallet: rawWallet,
          });
          return signatureBytes(result.signature);
        },
      },
      "solana:devnet"
    );
  }, [signAndSendTransaction, wallet]);

  const status: WalletStatus = useMemo(() => {
    if (!providerReady) {
      return WALLET_STATUS.CONNECTING;
    }

    if (authenticated && wallet) {
      return WALLET_STATUS.CONNECTED;
    }

    if (authenticated) {
      return WALLET_STATUS.CONNECTING;
    }

    return WALLET_STATUS.DISCONNECTED;
  }, [authenticated, providerReady, wallet]);

  const value = useMemo<WalletContextValue>(
    () => ({
      mode,
      wallets,
      wallet,
      activeWalletAddress: wallet?.account.address,
      setActiveWalletAddress: (next) => {
        setSelectedWalletAddressState(next);
      },
      signer,
      status,
      error: undefined,
      isReady: providerReady,
    }),
    [mode, wallets, wallet, signer, status, providerReady]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function WalletProvider({
  children,
  mode = "privy",
}: PropsWithChildren<{ mode?: WalletMode }>) {
  if (mode === "privy") {
    return <WalletProviderImpl mode="privy">{children}</WalletProviderImpl>;
  }

  return <WalletFallbackProvider mode={mode}>{children}</WalletFallbackProvider>;
}

export function WalletFallbackProvider({
  children,
  mode = "privy",
}: PropsWithChildren<{ mode?: WalletMode }>) {
  const value = useMemo(() => createDisconnectedValue(mode), [mode]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
