"use client";

import { useEffect, useRef, useState } from "react";
import { useCreateWallet } from "@privy-io/react-auth/solana";
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useWallet } from "../lib/wallet/context";
import { useBalance } from "../lib/hooks/use-balance";
import { lamportsToSolString } from "../lib/lamports";
import { ellipsify } from "../lib/explorer";
import { useCluster } from "./cluster-context";

export function WalletButton() {
  const { mode } = useWallet();

  if (mode === "privy") {
    return <PrivyWalletButton />;
  }

  return <MissingPrivyButton />;
}

function PrivyWalletButton() {
  const {
    wallet,
    wallets,
    status,
    error,
    isReady,
    setActiveWalletAddress,
  } = useWallet();
  const { authenticated } = usePrivy();
  const { login } = useLogin({
    onError: (error) => {
      toast.error(getLoginErrorMessage(error));
    },
  });
  const { createWallet } = useCreateWallet();
  const { getExplorerUrl } = useCluster();

  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const address = wallet?.account.address;
  const balance = useBalance(address);
  const hasEmbeddedWallet = wallets.some((entry) => entry.kind === "embedded");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buttonLabel = !isReady
    ? "Loading..."
    : status === "connecting"
      ? "Connecting..."
      : wallet?.connector.name ?? (address ? ellipsify(String(address), 4) : "Sign in");

  if (!isReady || status !== "connected") {
    return (
        <button
          onClick={() => {
            void login({ loginMethods: ["wallet", "email"] });
          }}
          className="cursor-pointer rounded-[var(--radius)] border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Sign in
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((current) => !current)}
        className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        <span className="h-2 w-2 rounded-full bg-oath-gold" />
        <span className="font-mono">{buttonLabel}</span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-[var(--radius)] border border-border bg-background/95 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">Balance</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
              {balance.lamports != null
                ? lamportsToSolString(balance.lamports)
                : "\u2014"}{" "}
              <span className="text-sm font-normal text-oath-muted-text">SOL</span>
            </p>
          </div>

          <div className="mb-4 rounded-[var(--radius)] border border-border bg-muted/60 px-3 py-2">
            <p className="break-all font-mono text-xs text-foreground">{address}</p>
          </div>

          {wallets.length > 1 ? (
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                Wallets
              </p>
              <div className="space-y-2">
                {wallets.map((entry) => {
                  const active = entry.account.address === wallet?.account.address;
                  return (
                    <button
                      key={entry.account.address}
                      onClick={() => setActiveWalletAddress(entry.account.address)}
                      className={`flex w-full items-center justify-between rounded-[var(--radius)] border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-oath-gold bg-oath-gold/10 text-foreground"
                          : "border-border bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="truncate">{entry.connector.name}</span>
                      <span className="ml-3 text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">
                        {entry.kind}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 cursor-pointer rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {copied ? "Copied!" : "Copy address"}
            </button>
            <a
              href={getExplorerUrl(`/address/${address}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-center text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Explorer
            </a>
          </div>

          <div className="mt-3 space-y-2">
            {!hasEmbeddedWallet && authenticated ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  void createWallet();
                }}
                className="w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Create Solana wallet
              </button>
            ) : null}
            <button
              onClick={() => {
                void (async () => {
                  if (!wallet) {
                    setIsOpen(false);
                    return;
                  }

                  try {
                    await wallet.disconnect();
                  } catch (disconnectError) {
                    console.error("Failed to disconnect wallet", disconnectError);
                  } finally {
                    setIsOpen(false);
                  }
                })();
              }}
              className="w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
            >
              Disconnect
            </button>
          </div>

          {error != null ? (
            <p className="mt-3 text-xs leading-5 text-destructive">
              {error instanceof Error ? error.message : String(error)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function getLoginErrorMessage(error: string) {
  if (error === "disallowed_login_method") {
    return "Wallet login is disabled for this Privy app. Enable wallet auth in the Privy dashboard.";
  }

  if (error === "allowlist_rejected") {
    return "This origin is not allowed for the current Privy app. Add your localhost URL in Privy allowed origins or use a dev app client.";
  }

  return "Wallet auth failed. If Privy SIWS is returning 403, enable Solana wallet login and allow this origin in Privy.";
}

function MissingPrivyButton() {
  return (
    <button
      type="button"
      className="cursor-not-allowed rounded-[var(--radius)] border border-border bg-background px-5 py-2.5 text-sm font-semibold text-muted-foreground"
      disabled
    >
      Sign in
    </button>
  );
}
