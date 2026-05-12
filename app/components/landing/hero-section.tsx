"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, ShieldCheck, Users } from "@phosphor-icons/react/dist/ssr";

export function HeroSection() {
  return (
    <section className="grid gap-12 pt-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
      <div className="space-y-10">
        <div className="space-y-8">
          <Badge
            variant="outline"
            className="border-oath-border bg-oath-surface/80 px-2.5 py-1 text-[9px] sm:text-[0.7rem] uppercase tracking-[0.1em] sm:tracking-[0.3em] text-oath-muted-text max-w-full truncate"
          >
            ◆ The Protocol for Human follow-through
          </Badge>

          <div className="max-w-4xl space-y-6">
            <h1 className="max-w-4xl text-5xl sm:text-7xl lg:text-9xl font-extrabold tracking-[-0.05em] leading-[1.1] sm:leading-[0.9] uppercase">
              Commitment <br />
              <span className="text-oath-gold italic">market</span> on Solana.
            </h1>
            <p className="max-w-2xl text-[13px] sm:text-2xl font-medium leading-relaxed text-muted-foreground border-l-4 border-oath-gold/40 pl-4 sm:pl-8 py-1 sm:py-2">
              Public commitments. <br />
              Real stakes. <br />
              Permanent record.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-oath-gold px-10 py-7 sm:py-9 text-lg font-black uppercase tracking-wider text-oath-black hover:bg-oath-gold/90 shadow-[0_20px_40px_rgb(223,255,0,0.3)] transition-all hover:scale-[1.05] active:scale-[0.95]"
          >
            <Link href="/create">Make Your First Oath</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-xl border-oath-border bg-oath-surface/40 px-10 py-7 sm:py-9 text-lg font-bold text-foreground hover:bg-oath-surface/80 backdrop-blur-md transition-all"
          >
            <Link href="/#how-it-works">How It Works</Link>
          </Button>
        </div>

        {/* Pill badges row */}
        <div className="flex flex-wrap items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
          <span className="flex items-center gap-1 rounded-full border border-oath-border bg-oath-surface/40 px-2 py-1 sm:px-4 sm:py-2">
            <Users size={12} className="text-oath-gold" />
            EARN YIELD
          </span>
          <span className="flex items-center gap-1 rounded-full border border-oath-border bg-oath-surface/40 px-2 py-1 sm:px-4 sm:py-2">
            <CheckCircle size={12} className="text-oath-gold" />
            AI COACH
          </span>
          <span className="flex items-center gap-1 rounded-full border border-oath-border bg-oath-surface/40 px-2 py-1 sm:px-4 sm:py-2">
            <ShieldCheck size={12} className="text-oath-gold" />
            ON-CHAIN REPUTATION
          </span>
        </div>
      </div>

      {/* Hero Right Panel - The Arena Terminal Preview */}
      <div className="relative group">
        {/* Elite Ambient Glow */}
        <div className="absolute -inset-4 z-0 bg-oath-gold/20 blur-[100px] rounded-[3rem] opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />

        <div className="relative z-10 overflow-hidden rounded-[2.5rem] border border-white/10 bg-black shadow-[0_32px_64px_rgba(0,0,0,0.4)] backdrop-blur-3xl transition-all duration-700 group-hover:translate-y-[-12px] group-hover:border-oath-gold/30">
          {/* Terminal Top Bar */}
          <div className="flex items-center justify-between bg-white/[0.03] px-6 py-4 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/10" />
            </div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-oath-gold animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-oath-gold/80">Terminal v1.0</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-oath-gold/10 border border-oath-gold/20 text-oath-gold px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                  MARKET ACTIVE
                </Badge>
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">ID: 0x82...F92</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white leading-[1.1] tracking-tight">
                "Ship one public build note every day for 30 days"
              </h3>
            </div>

            {/* Elite Progress Visualization */}
            <div className="space-y-4">
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Market Progress</p>
                  <p className="text-3xl font-mono font-black text-white">60.00%</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Time Remaining</p>
                  <p className="text-xl font-mono font-bold text-oath-gold">12D : 04H</p>
                </div>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-oath-gold/40 via-oath-gold to-white shadow-[0_0_20px_rgba(223,255,0,0.5)] transition-all duration-1000 ease-out"
                  style={{ width: '60%' }}
                />
                {/* Scanline effect */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.1)_50%,transparent_100%)] w-20 animate-[scan_3s_linear_infinite]" />
              </div>
            </div>

            {/* Metrics Ticker */}
            <div className="grid grid-cols-2 gap-px bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-black/40 p-5 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Total Stake</p>
                <p className="text-lg font-mono font-bold text-white">0.50 SOL</p>
              </div>
              <div className="bg-black/40 p-5 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Believers</p>
                <p className="text-lg font-mono font-bold text-white">14 Active</p>
              </div>
              <div className="bg-black/40 p-5 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Maker</p>
                <p className="text-xs font-mono font-bold text-oath-gold truncate">@shikhar.sol</p>
              </div>
              <div className="bg-black/40 p-5 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Risk Factor</p>
                <p className="text-xs font-mono font-bold text-white">LOW</p>
              </div>
            </div>

            <Button
              className="group/btn relative w-full h-16 overflow-hidden rounded-2xl bg-white text-black hover:bg-white transition-all duration-300"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.2em]">
                Enter Arena Market
                <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
              <div className="absolute inset-0 z-0 bg-oath-gold opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}