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
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const [shareImageDataUrl, setShareImageDataUrl] = useState<string | null>(null);
  
  const progressText = commitment.progressPercent > 0 
    ? `${commitment.progressPercent}% done` 
    : `Starting a ${commitment.totalDays}-day journey`;
    
  const believersText = commitment.believerCount > 0 
    ? `(${commitment.believerCount} believers backing me)` 
    : '';
    
  const shareText = `I just made a commitment on Oath Markets: "${commitment.title}" - staking ${commitment.stakeLabel} for ${commitment.totalDays} days. ${progressText} ${believersText}. Watch my progress or back me!`;

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