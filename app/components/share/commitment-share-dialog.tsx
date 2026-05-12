"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CommitmentShareCard } from "./commitment-share-card";
import { SharePlatformsGrid, getShareUrl } from "./share-platforms-grid";
import { ShareActionsRow } from "./share-actions-row";
import type { SharePlatform } from "./share-platform-button";
import type { CommitmentDetail } from "@/lib/oath-data";
import { useWallet } from "../../lib/wallet/context";
import { sameWalletAddress } from "@/lib/oath-access";

interface CommitmentShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commitment: CommitmentDetail;
}

export function CommitmentShareDialog({
  open,
  onOpenChange,
  commitment,
}: CommitmentShareDialogProps) {
  const { wallet } = useWallet();
  const walletAddress = wallet?.account.address;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const [shareImageDataUrl, setShareImageDataUrl] = useState<string | null>(null);

  // Dynamic Social Templates
  const getShareText = () => {
    const isMaker = walletAddress && sameWalletAddress(commitment.makerWalletAddress, walletAddress);
    const isBeliever = walletAddress && commitment.believers.some(b => sameWalletAddress(b.walletAddress, walletAddress));
    
    if (isMaker) {
      return `I just staked ${commitment.stakeLabel} on myself — committing to "${commitment.title}" for ${commitment.totalDays} days.\n\n${commitment.believerCount} people are already watching. Follow my progress 👇\n\n${shareUrl} #OATH #Solana`;
    }
    
    if (isBeliever) {
      return `I just co-staked on ${commitment.makerHandle} completing their "${commitment.title}" streak.\n\n${commitment.daysRemaining} days left. Let's go 🔥\n\n${shareUrl} #OATH`;
    }

    if (commitment.isAtRisk) {
      return `${commitment.makerHandle} is on Day ${commitment.proofCount}/${commitment.totalDays} of "${commitment.title}" with ${commitment.stakeLabel} at stake and hasn't submitted proof today.\n\nThis is getting interesting 👀\n\n${shareUrl} #OATH`;
    }

    return `Watching ${commitment.makerHandle} attempt "${commitment.title}" on OATH. ${commitment.believerCount} believers are backing them. Check it out 👇\n\n${shareUrl} #OATH`;
  };

  const shareText = getShareText();

  const handleShare = (platform: SharePlatform) => {
    const url = getShareUrl(platform, shareUrl, shareText);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="text-xl tracking-[-0.03em] sm:text-2xl">
            Share your commitment
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Spread the word and get believers behind you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-4 pb-4 sm:space-y-6 sm:px-6 sm:pb-6">
          <div className="space-y-2 sm:space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-oath-muted-text">
              Preview
            </p>
            <CommitmentShareCard 
              commitment={commitment} 
              onImageGenerated={setShareImageDataUrl}
            />
          </div>

          <Separator className="bg-oath-border" />

          <SharePlatformsGrid
            onShare={handleShare}
            shareUrl={shareUrl}
            shareText={shareText}
          />

          <Separator className="bg-oath-border" />

          <ShareActionsRow 
            shareUrl={shareUrl} 
            shareText={shareText}
            shareImageDataUrl={shareImageDataUrl}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}