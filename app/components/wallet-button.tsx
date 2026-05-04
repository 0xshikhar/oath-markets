"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useWallet } from "../lib/wallet/context";
import { useBalance } from "../lib/hooks/use-balance";
import { lamportsToSolString } from "../lib/lamports";
import { ellipsify } from "../lib/explorer";
import { useCluster } from "./cluster-context";
import { usePreviewSession } from "../lib/preview-session";

export function WalletButton() {
  const { connectors, connect, disconnect, wallet, status, error } =
    useWallet();

  const { getExplorerUrl } = useCluster();
  const {
    email: previewEmail,
    signIn: signInPreview,
    signOut: signOutPreview,
  } = usePreviewSession();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewInput, setPreviewInput] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const previewInputId = useId();

  const address = wallet?.account.address;
  const balance = useBalance(address);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
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

  if (status !== "connected") {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => (isOpen ? close() : open())}
          className="cursor-pointer rounded-[var(--radius)] border border-border bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          {previewEmail ? `Preview · ${previewEmail}` : "Connect Wallet"}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-[var(--radius)] border border-border bg-card p-3 shadow-none">
            <p className="mb-2 text-xs font-medium text-muted">
              Choose a wallet
            </p>
            <div className="space-y-1">
              {connectors.map((connector) => (
                <button
                  key={connector.id}
                  onClick={async () => {
                    try {
                      await connect(connector.id);
                      close();
                    } catch {
                      // connection errors are surfaced through context state
                    }
                  }}
                  disabled={status === "connecting"}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-left text-sm font-medium transition hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-[var(--radius)] border border-oath-border bg-oath-surface text-[0.62rem] uppercase text-oath-muted-text">
                    {connector.name.slice(0, 1)}
                  </span>
                  <span>{connector.name}</span>
                </button>
              ))}
            </div>
            <div className="my-3 border-t border-border" />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted">Preview with email</p>
              {previewEmail ? (
                <div className="space-y-2 rounded-[var(--radius)] border border-oath-border bg-background/40 p-3">
                  <p className="break-all text-sm font-medium text-foreground">
                    {previewEmail}
                  </p>
                  <button
                    onClick={() => {
                      signOutPreview();
                      setPreviewError(null);
                      setPreviewInput("");
                    }}
                    className="w-full rounded-[var(--radius)] border border-oath-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
                  >
                    Sign out preview
                  </button>
                </div>
              ) : (
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    try {
                      signInPreview(previewInput);
                      setPreviewError(null);
                      setPreviewInput("");
                      close();
                    } catch (error) {
                      setPreviewError(
                        error instanceof Error ? error.message : "Unable to start preview."
                      );
                    }
                  }}
                >
                  <label htmlFor={previewInputId} className="sr-only">
                    Email address
                  </label>
                  <input
                    id={previewInputId}
                    type="email"
                    autoComplete="email"
                    value={previewInput}
                    onChange={(event) => setPreviewInput(event.target.value)}
                    placeholder="you@example.com"
                    className="h-10 w-full rounded-[var(--radius)] border border-oath-border bg-background px-3 text-sm outline-none transition focus:border-foreground"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-[var(--radius)] bg-oath-gold px-3 py-2.5 text-sm font-semibold text-black transition hover:bg-oath-gold/90"
                  >
                    Continue with email
                  </button>
                  {previewError ? (
                    <p className="text-xs text-destructive">{previewError}</p>
                  ) : (
                    <p className="text-xs text-muted">
                      Preview mode keeps the app usable without a wallet.
                    </p>
                  )}
                </form>
              )}
            </div>
            {status === "connecting" && (
              <p className="mt-2 text-xs text-muted">Connecting...</p>
            )}
            {error != null && (
              <p className="mt-2 text-xs text-destructive">
                {error instanceof Error ? error.message : String(error)}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => (isOpen ? close() : open())}
        className="flex cursor-pointer items-center gap-2 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
      >
        <span className="h-2 w-2 rounded-full bg-oath-gold" />
        <span className="font-mono">{previewEmail ?? ellipsify(address!, 4)}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-[var(--radius)] border border-border bg-card p-4 shadow-none">
          <div className="mb-3">
            <p className="text-xs text-muted">Balance</p>
            <p className="text-lg font-bold tabular-nums">
              {balance.lamports != null
                ? lamportsToSolString(balance.lamports)
                : "\u2014"}{" "}
              <span className="text-sm font-normal text-muted">SOL</span>
            </p>
          </div>

          <div className="mb-3 rounded-[var(--radius)] border border-border bg-muted/60 px-3 py-2">
            <p className="break-all font-mono text-xs">{address}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 cursor-pointer rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              {copied ? "Copied!" : "Copy address"}
            </button>
            <a
              href={getExplorerUrl(`/address/${address}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-center text-sm font-medium transition hover:bg-muted"
            >
              Explorer
            </a>
          </div>

          <button
            onClick={() => {
              disconnect();
              close();
            }}
            className="mt-2 w-full cursor-pointer rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
