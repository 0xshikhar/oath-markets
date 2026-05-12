"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Fire, Coins, Users } from "@phosphor-icons/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface LeaderboardEntry {
  slug: string;
  title: string;
  maker: {
    username: string | null;
    walletAddress: string;
    avatarUrl: string | null;
  };
  value: number;
  label: string;
}

export function Leaderboard() {
  const [data, setData] = useState<{
    streaks: LeaderboardEntry[];
    stakes: LeaderboardEntry[];
    believers: LeaderboardEntry[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then(res => res.json())
      .then(d => {
        if (d.ok) setData(d.leaderboards);
      })
      .catch(err => console.error("Failed to fetch leaderboard", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border border-black/5 rounded-[2rem] p-8 space-y-6 animate-pulse">
        <div className="h-4 bg-black/5 rounded w-1/3" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black/5 rounded-full" />
              <div className="flex-1 h-3 bg-black/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white border border-black/5 rounded-[2rem] p-8 space-y-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Trophy size={20} weight="fill" className="text-oath-gold" />
        <h2 className="text-xl font-black tracking-tight text-black">Arena Leaders</h2>
      </div>

      <Tabs defaultValue="streaks" className="w-full">
        <TabsList className="grid grid-cols-3 bg-black/[0.02] border border-black/5 p-1 rounded-xl h-auto">
          <TabsTrigger value="streaks" className="text-[9px] font-black uppercase tracking-widest py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Streaks
          </TabsTrigger>
          <TabsTrigger value="stakes" className="text-[9px] font-black uppercase tracking-widest py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Stakes
          </TabsTrigger>
          <TabsTrigger value="believers" className="text-[9px] font-black uppercase tracking-widest py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Hype
          </TabsTrigger>
        </TabsList>

        <LeaderboardContent value="streaks" entries={data.streaks} icon={<Fire size={12} />} />
        <LeaderboardContent value="stakes" entries={data.stakes} icon={<Coins size={12} />} />
        <LeaderboardContent value="believers" entries={data.believers} icon={<Users size={12} />} />
      </Tabs>
    </div>
  );
}

function LeaderboardContent({ value, entries, icon }: { value: string; entries: LeaderboardEntry[]; icon: React.ReactNode }) {
  return (
    <TabsContent value={value} className="mt-6 space-y-4">
      {entries.map((entry, idx) => (
        <Link 
          key={entry.slug} 
          href={`/c/${entry.slug}`}
          className="flex items-center gap-3 group hover:translate-x-1 transition-transform"
        >
          <div className="relative">
            <Avatar className="w-8 h-8 border border-black/5">
              <AvatarImage src={entry.maker.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${entry.maker.walletAddress}`} />
              <AvatarFallback className="bg-black/5 text-[10px] font-bold">
                {entry.maker.username?.slice(0, 2).toUpperCase() || "0X"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-black text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white">
              {idx + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-black truncate group-hover:text-oath-gold transition-colors">
              {entry.maker.username || `${entry.maker.walletAddress.slice(0, 4)}...${entry.maker.walletAddress.slice(-4)}`}
            </p>
            <p className="text-[9px] font-medium text-black/40 truncate italic">{entry.title}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-[10px] font-mono font-black text-black">
              {icon}
              {entry.value}
            </div>
            <p className="text-[8px] font-mono text-black/20 uppercase tracking-widest">{entry.label}</p>
          </div>
        </Link>
      ))}
    </TabsContent>
  );
}
