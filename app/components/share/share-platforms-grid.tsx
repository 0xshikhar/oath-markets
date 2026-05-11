"use client";

import { SharePlatformButton, type SharePlatform } from "./share-platform-button";

interface SharePlatformsGridProps {
  onShare: (platform: SharePlatform) => void;
  shareUrl: string;
  shareText: string;
}

const platforms: SharePlatform[] = ["twitter", "whatsapp", "linkedin", "telegram", "facebook"];

export function SharePlatformsGrid({ onShare, shareUrl, shareText }: SharePlatformsGridProps) {
  const handlePlatformClick = (platform: SharePlatform) => {
    onShare(platform);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-oath-muted-text">
        Share to platform
      </p>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {platforms.map((platform) => (
          <SharePlatformButton
            key={platform}
            platform={platform}
            onClick={() => handlePlatformClick(platform)}
          />
        ))}
      </div>
    </div>
  );
}

export function getShareUrl(platform: SharePlatform, shareUrl: string, shareText: string): string {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    default:
      return shareUrl;
  }
}