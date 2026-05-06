import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">You&apos;re offline</h1>
        <p className="text-sm text-muted-foreground">
          OATH needs a connection to load oaths, escrow state, and on-chain proofs.
          Reconnect and we&apos;ll pick up where you left off.
        </p>
      </div>
    </main>
  );
}
