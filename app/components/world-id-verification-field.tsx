"use client";

import { useEffect, useRef, useState } from "react";
import {
  IDKitRequestWidget,
  orbLegacy,
  type IDKitResult,
  type RpContext,
} from "@worldcoin/idkit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type WorldIdRequestResponse =
  | {
      ok: true;
      appId: string;
      action: string;
      environment: "production" | "staging";
      rpContext: RpContext;
    }
  | {
      ok: false;
      error?: string;
    };

type WorldIdVerifyResponse =
  | {
      ok: true;
      verified: boolean;
      nullifier: string | null;
    }
  | {
      ok: false;
      error?: string;
    };

type WorldIdStatusResponse =
  | {
      ok: true;
      verified: boolean;
      linked: boolean;
    }
  | {
      ok: false;
      error?: string;
    };

type WorldIdVerificationFieldProps = {
  walletAddress?: string;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
};

export function WorldIdVerificationField({
  walletAddress,
  verified,
  onVerifiedChange,
}: WorldIdVerificationFieldProps) {
  const [isPreparing, setIsPreparing] = useState(false);
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<Extract<WorldIdRequestResponse, { ok: true }> | null>(
    null
  );
  const [requestWalletAddress, setRequestWalletAddress] = useState<string | null>(null);
  const verifiedChangeRef = useRef(onVerifiedChange);

  useEffect(() => {
    verifiedChangeRef.current = onVerifiedChange;
  }, [onVerifiedChange]);

  useEffect(() => {
    let cancelled = false;

    if (!walletAddress) {
      verifiedChangeRef.current(false);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const response = await fetch(
          `/api/world-id/status?walletAddress=${encodeURIComponent(walletAddress)}`,
          { cache: "no-store" }
        );
        const data = (await response.json()) as WorldIdStatusResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.ok ? "Unable to load World ID status" : data.error ?? "Unable to load World ID status");
        }

        if (!cancelled) {
          verifiedChangeRef.current(data.verified);
        }
      } catch {
        if (!cancelled) {
          verifiedChangeRef.current(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const prepareVerification = async () => {
    if (!walletAddress) {
      toast.error("Connect your wallet to verify with World ID.");
      return;
    }

    if (verified) {
      return;
    }

    setIsPreparing(true);
    try {
      const response = await fetch("/api/world-id/request", {
        cache: "no-store",
      });
      const data = (await response.json()) as WorldIdRequestResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.ok ? "Unable to prepare World ID verification" : data.error ?? "Unable to prepare World ID verification");
      }

      setRequest(data);
      setRequestWalletAddress(walletAddress);
      setOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to prepare World ID verification");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleVerify = async (result: IDKitResult) => {
    if (!walletAddress) {
      throw new Error("Connect your wallet to verify with World ID.");
    }

    const response = await fetch("/api/world-id/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress,
        idkitResponse: result,
      }),
    });

    const data = (await response.json()) as WorldIdVerifyResponse;

    if (!response.ok || !data.ok) {
      throw new Error(data.ok ? "World ID verification failed" : data.error ?? "World ID verification failed");
    }
  };

  const handleSuccess = async () => {
    verifiedChangeRef.current(true);
    setOpen(false);
    setRequest(null);
    setRequestWalletAddress(null);
    toast.success("World ID verified.");
  };

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                verified
                  ? "bg-oath-green/10 text-oath-green hover:bg-oath-green/20"
                  : "bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20"
              }
            >
              {verified ? "Verified human" : "World ID"}
            </Badge>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            {verified
              ? "This wallet is linked to a World ID proof. The badge is now backed by a stored nullifier."
              : "Verify once with World ID to unlock the human badge. We only keep the nullifier and verified flag."}
          </p>
        </div>
        <Button
          type="button"
          onClick={prepareVerification}
          disabled={isPreparing || !walletAddress || verified}
          className={
            verified
              ? "rounded-[var(--radius)] bg-oath-green text-black hover:bg-oath-green/90"
              : "rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
          }
        >
          {verified ? "Verified" : isPreparing ? "Preparing..." : "Verify human"}
        </Button>
      </div>

      {request && requestWalletAddress === walletAddress ? (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id={request.appId as `app_${string}`}
          action={request.action}
          rp_context={request.rpContext}
          allow_legacy_proofs={true}
          environment={request.environment}
          preset={orbLegacy({ signal: walletAddress ?? "" })}
          handleVerify={handleVerify}
          onSuccess={handleSuccess}
        />
      ) : null}
    </div>
  );
}
