"use client";

import { Button } from "@/components/ui/button";
import {
  TwitterLogoIcon,
  LinkedinLogoIcon,
  ChatCircleIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";

export type SharePlatform = "twitter" | "whatsapp" | "linkedin" | "telegram" | "facebook";

interface SharePlatformButtonProps {
  platform: SharePlatform;
  onClick: () => void;
  disabled?: boolean;
}

const platformConfig: Record<SharePlatform, { label: string; icon: React.ReactNode; bgClass: string }> = {
  twitter: {
    label: "X",
    icon: <TwitterLogoIcon weight="fill" className="h-4 w-4 sm:h-5 sm:w-5" />,
    bgClass: "bg-black hover:bg-black/90",
  },
  whatsapp: {
    label: "WhatsApp",
    icon: <ChatCircleIcon weight="fill" className="h-4 w-4 sm:h-5 sm:w-5" />,
    bgClass: "bg-[#25D366] hover:bg-[#25D366]/90",
  },
  linkedin: {
    label: "LinkedIn",
    icon: <LinkedinLogoIcon weight="fill" className="h-4 w-4 sm:h-5 sm:w-5" />,
    bgClass: "bg-[#0A66C2] hover:bg-[#0A66C2]/90",
  },
  telegram: {
    label: "Telegram",
    icon: <PaperPlaneTiltIcon weight="fill" className="h-4 w-4 sm:h-5 sm:w-5" />,
    bgClass: "bg-[#26A5E4] hover:bg-[#26A5E4]/90",
  },
  facebook: {
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current sm:h-5 sm:w-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    bgClass: "bg-[#1877F2] hover:bg-[#1877F2]/90",
  },
};

export function SharePlatformButton({ platform, onClick, disabled }: SharePlatformButtonProps) {
  const config = platformConfig[platform];

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 py-3 text-white transition-transform hover:scale-105 active:scale-95 sm:gap-2 sm:px-2 sm:py-4 ${config.bgClass}`}
    >
      {config.icon}
      <span className="text-[10px] font-medium leading-tight sm:text-xs">{config.label}</span>
    </Button>
  );
}