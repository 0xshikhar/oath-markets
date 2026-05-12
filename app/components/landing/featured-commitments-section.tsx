"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CommitmentCard } from "@/app/components/commitment-card";

// Mock data for featured commitments
const MOCK_COMMITMENTS = [
  {
    slug: "rust-daily-30",
    title: "Study Rust for 2 hours daily",
    description: "Mastering memory safety and ownership one day at a time.",
    category: "LEARNING",
    proofType: "IMAGE",
    makerName: "Alex Rivera",
    makerHandle: "@alex.sol",
    makerWalletAddress: "ALEx...r1v3",
    makerVerified: true,
    stakeLabel: "0.50 SOL",
    believerCount: 12,
    proofCount: 18,
    totalDays: 30,
    daysRemaining: 12,
    progressPercent: 60,
    status: "ACTIVE",
    statusLabel: "ACTIVE",
    coachToneLabel: "Supportive Friend",
    createdAtIso: new Date().toISOString(),
    createdAtLabel: "May 1",
    endDateLabel: "May 31, 2026",
    publicUrl: "/explore",
  },
  {
    slug: "run-5km-morning",
    title: "Run 5km every morning",
    description: "No excuses. Rain or shine. Proof via Strava links.",
    category: "HEALTH",
    proofType: "LINK",
    makerName: "Sarah Chen",
    makerHandle: "@sarah_runs",
    makerWalletAddress: "SArA...run5",
    makerVerified: true,
    stakeLabel: "1.00 SOL",
    believerCount: 24,
    proofCount: 8,
    totalDays: 21,
    daysRemaining: 13,
    progressPercent: 38,
    status: "ACTIVE",
    statusLabel: "ACTIVE",
    coachToneLabel: "Hard Truth",
    createdAtIso: new Date().toISOString(),
    createdAtLabel: "May 5",
    endDateLabel: "May 26, 2026",
    publicUrl: "/explore",
  },
  {
    slug: "design-tip-twitter",
    title: "Post 1 design tip on Twitter",
    description: "Building my audience by sharing value every single day.",
    category: "GROWTH",
    proofType: "LINK",
    makerName: "Marcus Thorne",
    makerHandle: "@marcus.design",
    makerWalletAddress: "MArc...uS5D",
    makerVerified: false,
    stakeLabel: "0.25 SOL",
    believerCount: 8,
    proofCount: 27,
    totalDays: 30,
    daysRemaining: 3,
    progressPercent: 90,
    status: "ACTIVE",
    statusLabel: "ACTIVE",
    coachToneLabel: "Supportive Friend",
    createdAtIso: new Date().toISOString(),
    createdAtLabel: "Apr 15",
    endDateLabel: "May 15, 2026",
    publicUrl: "/explore",
  },
];

export function FeaturedCommitmentsSection() {
  return (
    <section className="space-y-16">
      <div className="flex flex-wrap items-end justify-between gap-8 border-b border-oath-border pb-10">
        <div className="space-y-4">
          <Badge
            variant="outline"
            className="border-oath-border bg-oath-surface/80 text-[0.7rem] uppercase tracking-[0.4em] text-oath-muted-text px-5 py-2"
          >
            MARKET DATA
          </Badge>
          <h2 className="text-4xl font-extrabold tracking-[-0.04em] sm:text-8xl uppercase">
            The Arena.
          </h2>
        </div>
        <Button
          variant="ghost"
          className="text-lg font-bold uppercase tracking-widest text-oath-black hover:bg-oath-gold/10 px-8 py-6 mb-2 cursor-default"
        >
          <Link href="/explore">Enter the Arena →</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {MOCK_COMMITMENTS.map((commitment) => (
          <CommitmentCard key={commitment.slug} commitment={commitment as any} />
        ))}
      </div>
    </section>
  );
}