"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { CommitmentDetail } from "@/lib/oath-data";

function ellipsify(value: string, visible = 4) {
  if (value.length <= visible * 2 + 3) return value;
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

interface CommitmentShareCardProps {
  commitment: CommitmentDetail;
  onImageGenerated?: (dataUrl: string) => void;
}

export function CommitmentShareCard({ commitment, onImageGenerated }: CommitmentShareCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const hasCalledCallback = useRef(false);

  const generateImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(223, 255, 0, 0.08)");
    gradient.addColorStop(1, "rgba(223, 255, 0, 0.02)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#e5e5e5";
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    ctx.fillStyle = "#dfff00";
    ctx.fillRect(40, 40, 8, height - 80);

    ctx.font = "bold 48px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#131313";
    ctx.fillText("OATH", 80, 100);

    ctx.font = "14px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#454932";
    ctx.fillText("PUBLIC ACCOUNTABILITY", 80, 125);

    ctx.font = "bold 36px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#131313";
    const title = commitment.title.length > 45 ? commitment.title.slice(0, 45) + "..." : commitment.title;
    ctx.fillText(title, 80, 180);

    const descMaxLength = 120;
    const desc = commitment.description.length > descMaxLength
      ? commitment.description.slice(0, descMaxLength) + "..."
      : commitment.description;
    ctx.font = "18px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#454932";
    wrapText(ctx, desc, 80, 220, width - 160, 26);

    const statsY = 340;
    const statBoxWidth = 260;
    const statGap = 20;

    const drawStatBox = (x: number, label: string, value: string) => {
      ctx.fillStyle = "#f3f3f4";
      ctx.beginPath();
      ctx.roundRect(x, statsY, statBoxWidth, 90, 8);
      ctx.fill();

      ctx.strokeStyle = "#e5e5e5";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "12px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#454932";
      ctx.fillText(label.toUpperCase(), x + 16, statsY + 30);

      ctx.font = "bold 20px JetBrains Mono, monospace";
      ctx.fillStyle = "#131313";
      ctx.fillText(value, x + 16, statsY + 60);
    };

    drawStatBox(80, "STAKED", commitment.stakeLabel);
    drawStatBox(80 + statBoxWidth + statGap, "BELIEVERS", commitment.believerCount.toString());
    drawStatBox(80 + (statBoxWidth + statGap) * 2, "DURATION", `${commitment.totalDays} DAYS`);

    const walletX = 80;
    const walletY = 460;

    ctx.fillStyle = "#f3f3f4";
    ctx.beginPath();
    ctx.roundRect(walletX, walletY, width - 160, 50, 8);
    ctx.fill();

    ctx.strokeStyle = "#e5e5e5";
    ctx.stroke();

    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#454932";
    ctx.fillText("MAKER WALLET", walletX + 16, walletY + 20);

    ctx.font = "16px JetBrains Mono, monospace";
    ctx.fillStyle = "#131313";
    ctx.fillText(ellipsify(commitment.makerWalletAddress, 8), walletX + 16, walletY + 40);

    ctx.font = "14px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#6b6d6d";
    ctx.fillText("OATH markets", width - 80 - 100, height - 50);

    const dataUrl = canvas.toDataURL("image/png");
    setImageDataUrl(dataUrl);

    if (onImageGenerated && !hasCalledCallback.current) {
      onImageGenerated(dataUrl);
      hasCalledCallback.current = true;
    }
  }, [commitment, onImageGenerated]);

  useEffect(() => {
    hasCalledCallback.current = false;
    const timer = setTimeout(() => {
      setImageDataUrl(null);
      generateImage();
    }, 100);
    return () => clearTimeout(timer);
  }, [commitment, generateImage]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-oath-border bg-oath-surface">
      <canvas
        ref={canvasRef}
        className="hidden"
        aria-label="Share card canvas"
      />
      {imageDataUrl ? (
        <img
          src={imageDataUrl}
          alt="Share preview"
          className="aspect-[1.91/1] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-oath-surface-dim">
          <span className="text-sm text-oath-muted-text">Loading preview...</span>
        </div>
      )}
    </div>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}