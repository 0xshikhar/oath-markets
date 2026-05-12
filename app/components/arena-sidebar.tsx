"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendUp } from "@phosphor-icons/react/dist/ssr";
import { Leaderboard } from "./leaderboard";

export function ArenaSidebar() {
  return (
    <aside className="hidden lg:block space-y-6 w-[320px] shrink-0">
      {/* Network Pulse Card */}
      <Card className="border-black/5 bg-white shadow-sm overflow-hidden group relative rounded-[2rem]">
        <div className="absolute inset-0 bg-gradient-to-br from-oath-gold/5 via-transparent to-transparent opacity-50" />
        <CardHeader className="relative p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <TrendUp size={14} className="text-oath-gold" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Network Pulse</span>
          </div>
          <CardTitle className="text-xl font-black tracking-tight text-black">Arena Stats</CardTitle>
        </CardHeader>
        <CardContent className="relative p-6 pt-2 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/[0.03] rounded-2xl p-4 border border-black/5">
              <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Active SOL</p>
              <p className="text-lg font-mono font-black text-black leading-none">42.50</p>
            </div>
            <div className="bg-black/[0.03] rounded-2xl p-4 border border-black/5">
              <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Success Rate</p>
              <p className="text-lg font-mono font-black text-oath-gold leading-none">84%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Leaderboard />

      {/* Community Call to Action */}
      <div className="p-8 rounded-[2rem] border border-oath-gold/20 bg-gradient-to-br from-oath-gold/10 via-white/50 to-white shadow-sm">
        <h4 className="text-xs font-black text-black uppercase tracking-[0.1em] mb-2">Start a Challenge</h4>
        <p className="text-[11px] text-black/60 leading-relaxed font-medium">
          The best way to build reputation is to challenge a peer. Public, funded, and witnessed.
        </p>
        <Link href="/create">
          <Button className="w-full mt-6 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl h-12 hover:bg-oath-gold hover:text-black transition-all shadow-md">
            Create New Oath
          </Button>
        </Link>
      </div>
    </aside>
  );
}
