"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, Download, ShareNetworkIcon, Check } from "@phosphor-icons/react";

interface ShareActionsRowProps {
  shareUrl: string;
  shareText: string;
  shareImageDataUrl?: string | null;
}

export function ShareActionsRow({ shareUrl, shareText, shareImageDataUrl }: ShareActionsRowProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const downloadImage = async () => {
    if (!shareImageDataUrl) {
      toast.error("Please wait for the preview to load");
      return;
    }
    
    setIsDownloading(true);
    try {
      const link = document.createElement("a");
      link.download = `oath-commitment-${Date.now()}.png`;
      link.href = shareImageDataUrl;
      link.click();

      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Oath Markets Commitment",
          text: shareText,
          url: shareUrl,
        });
        toast.success("Shared successfully!");
      } catch {
        // User cancelled or share failed silently
      }
    } else {
      toast.error("Sharing not supported on this device");
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-oath-muted-text">
        More options
      </p>
      <div className="flex items-stretch justify-center gap-2">
        <Button
          variant="outline"
          onClick={copyToClipboard}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-lg border-oath-border bg-background/40 px-2 text-xs hover:bg-oath-gold/10 sm:h-14 sm:gap-2 sm:px-3 sm:text-sm"
        >
          {copied ? (
            <Check className="h-4 w-4 text-oath-green sm:h-5 sm:w-5" weight="fill" />
          ) : (
            <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
          <span className="font-medium">{copied ? "Copied!" : "Copy link"}</span>
        </Button>

        <Button
          variant="outline"
          onClick={downloadImage}
          disabled={isDownloading || !shareImageDataUrl}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-lg border-oath-border bg-background/40 px-2 text-xs hover:bg-oath-gold/10 disabled:opacity-50 sm:h-14 sm:gap-2 sm:px-3 sm:text-sm"
        >
          <Download className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">{isDownloading ? "Saving..." : "Download"}</span>
        </Button>

        <Button
          variant="outline"
          onClick={nativeShare}
          className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-lg border-oath-border bg-background/40 px-2 text-xs hover:bg-oath-gold/10 sm:h-14 sm:gap-2 sm:px-3 sm:text-sm"
        >
          <ShareNetworkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="font-medium">More</span>
        </Button>
      </div>
    </div>
  );
}