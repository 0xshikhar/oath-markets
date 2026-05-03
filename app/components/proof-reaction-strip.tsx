"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWallet } from "../lib/wallet/context";
import type { ReactionCounts } from "@/lib/oath-data";

type ProofReactionStripProps = {
  proofId: string;
  initialCounts: ReactionCounts;
};

type ReactionType = "MOMENTUM" | "STREAK" | "WATCHING" | "DOUBT";

const reactions: Array<{
  type: ReactionType;
  emoji: string;
  label: string;
  short: string;
}> = [
  { type: "MOMENTUM", emoji: "🔥", label: "Momentum", short: "M" },
  { type: "STREAK", emoji: "⚡", label: "Streak", short: "S" },
  { type: "WATCHING", emoji: "👀", label: "Watching", short: "W" },
  { type: "DOUBT", emoji: "💀", label: "Doubt", short: "D" },
];

type ReactionState = {
  counts: ReactionCounts;
  viewerTypes: ReactionType[];
};

export function ProofReactionStrip({
  proofId,
  initialCounts,
}: ProofReactionStripProps) {
  const { wallet } = useWallet();
  const queryClient = useQueryClient();
  const walletAddress = wallet?.account.address
    ? String(wallet.account.address)
    : undefined;
  const queryKey = ["proof-reactions", proofId, walletAddress ?? "guest"] as const;

  const reactionQuery = useQuery({
    queryKey,
    queryFn: async (): Promise<ReactionState> => {
      const response = await fetch(
        `/api/proofs/${proofId}/react${
          walletAddress ? `?walletAddress=${encodeURIComponent(walletAddress)}` : ""
        }`
      );
      const data = (await response.json()) as any;

      if (!response.ok || !data.ok) {
        throw new Error("Unable to load reactions");
      }

      return {
        counts: data.counts,
        viewerTypes: data.viewerTypes,
      };
    },
    enabled: Boolean(proofId),
    initialData: {
      counts: initialCounts,
      viewerTypes: [],
    },
  });

  const mutation = useMutation({
    mutationFn: async (type: ReactionType) => {
      if (!walletAddress) {
        throw new Error("Connect a wallet to react.");
      }

      const response = await fetch(`/api/proofs/${proofId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          type,
        }),
      });
      const data = (await response.json()) as any;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Reaction failed");
      }

      return data;
    },
    onMutate: async (type) => {
      if (!walletAddress) return;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ReactionState>(queryKey) ?? {
        counts: initialCounts,
        viewerTypes: [],
      };

      const nextTypes = previous.viewerTypes.includes(type)
        ? previous.viewerTypes
        : [...previous.viewerTypes, type];

      queryClient.setQueryData<ReactionState>(queryKey, {
        counts: {
          ...previous.counts,
          [reactionKey(type)]: previous.counts[reactionKey(type)] + 1,
          total: previous.counts.total + 1,
        },
        viewerTypes: nextTypes,
      });

      return { previous };
    },
    onError: (error, _type, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(error instanceof Error ? error.message : "Reaction failed");
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ReactionState>(queryKey, {
        counts: data.counts,
        viewerTypes: data.viewerTypes,
      });
    },
  });

  const state = reactionQuery.data ?? {
    counts: initialCounts,
    viewerTypes: [],
  };
  const total = state.counts.total;
  const isLoading = reactionQuery.isLoading || mutation.isPending;

  const buttonClassName = useMemo(
    () =>
      "rounded-full border border-oath-border bg-background/50 px-3 py-2 text-xs transition hover:border-oath-gold/40 hover:bg-oath-gold/10",
    []
  );

  return (
    <div className="space-y-3 rounded-2xl border border-oath-border bg-background/30 p-3">
      <div className="flex flex-wrap gap-2">
        {reactions.map((reaction) => {
          const active = state.viewerTypes.includes(reaction.type);
          const count = state.counts[reactionKey(reaction.type)];

          return (
            <Button
              key={reaction.type}
              type="button"
              variant="outline"
              className={`${buttonClassName} ${
                active
                  ? "border-oath-gold bg-oath-gold/10 text-oath-gold"
                  : "text-muted-foreground"
              }`}
              disabled={isLoading || !walletAddress}
              onClick={() => mutation.mutate(reaction.type)}
              title={reaction.label}
            >
              <span className="mr-2 text-sm">{reaction.emoji}</span>
              <span className="font-mono">{count}</span>
            </Button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">
        <span>Total reactions</span>
        <span className="font-mono text-foreground">{total}</span>
      </div>
    </div>
  );
}

function reactionKey(type: ReactionType): keyof ReactionCounts {
  if (type === "MOMENTUM") return "momentum";
  if (type === "STREAK") return "streak";
  if (type === "WATCHING") return "watching";
  return "doubt";
}
