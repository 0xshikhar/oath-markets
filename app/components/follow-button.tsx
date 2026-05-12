"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useWallet } from "../lib/wallet/context";

type FollowButtonProps = {
  targetWalletAddress: string;
  className?: string;
};

type FollowState = {
  isFollowing: boolean;
  followerCount: number;
  followingCount: number;
};

const initialState: FollowState = {
  isFollowing: false,
  followerCount: 0,
  followingCount: 0,
};

export function FollowButton({
  targetWalletAddress,
  className,
}: FollowButtonProps) {
  const { wallet } = useWallet();
  const queryClient = useQueryClient();
  const viewerWalletAddress = wallet?.account.address
    ? String(wallet.account.address)
    : undefined;
  const isSelf = Boolean(
    viewerWalletAddress &&
      viewerWalletAddress.toLowerCase() === targetWalletAddress.toLowerCase()
  );

  const followStateQuery = useQuery({
    queryKey: ["follow-state", viewerWalletAddress ?? "guest", targetWalletAddress],
    queryFn: async (): Promise<FollowState> => {
      if (!viewerWalletAddress || isSelf) return initialState;
      const response = await fetch(
        `/api/follows?followerWallet=${encodeURIComponent(
          viewerWalletAddress
        )}&followingWallet=${encodeURIComponent(targetWalletAddress)}`
      );
      const data = (await response.json()) as any;

      if (!response.ok || !data.ok) {
        throw new Error("Unable to load follow state");
      }

      return {
        isFollowing: data.isFollowing,
        followerCount: data.followerCount,
        followingCount: data.followingCount,
      };
    },
    enabled: Boolean(viewerWalletAddress && targetWalletAddress && !isSelf),
    initialData: initialState,
  });

  const followMutation = useMutation({
    mutationFn: async (nextState: boolean) => {
      if (!viewerWalletAddress) {
        throw new Error("Connect a wallet to follow someone.");
      }

      const response = await fetch("/api/follows", {
        method: nextState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerWallet: viewerWalletAddress,
          followingWallet: targetWalletAddress,
        }),
      });
      const data = (await response.json()) as any;

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Follow update failed");
      }

      return data;
    },
    onMutate: async (nextState) => {
      if (!viewerWalletAddress) return;
      const queryKey = [
        "follow-state",
        viewerWalletAddress ?? "guest",
        targetWalletAddress,
      ] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<FollowState>(queryKey) ?? initialState;

      queryClient.setQueryData<FollowState>(queryKey, {
        ...previous,
        isFollowing: nextState,
        followerCount: Math.max(previous.followerCount + (nextState ? 1 : -1), 0),
      });

      return { previous, queryKey };
    },
    onError: (error, _nextState, context) => {
      if (!context) return;
      queryClient.setQueryData(context.queryKey, context.previous);
      toast.error(error instanceof Error ? error.message : "Follow update failed");
    },
    onSuccess: (data, nextState, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, {
          isFollowing: data.isFollowing,
          followerCount: data.followerCount,
          followingCount: data.followingCount,
        });
      }
      toast.success(nextState ? "Following" : "Unfollowed");
    },
  });

  if (isSelf) {
    return (
      <Button className={className} variant="outline" disabled>
        This is you
      </Button>
    );
  }

  if (!viewerWalletAddress) {
    return (
      <Button className={className} variant="outline" disabled>
        Connect wallet to follow
      </Button>
    );
  }

  const state = followStateQuery.data ?? initialState;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button
        className={className}
        variant={state.isFollowing ? "outline" : "default"}
        onClick={() => followMutation.mutate(!state.isFollowing)}
        disabled={followMutation.isPending || followStateQuery.isLoading}
      >
        {followMutation.isPending
          ? "Updating..."
          : state.isFollowing
            ? "Following"
            : "Follow"}
      </Button>
      {!state.isFollowing && (
        <p className="text-[9px] font-mono text-black/20 uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-1 duration-500">
          Get proof alerts
        </p>
      )}
    </div>
  );
}
