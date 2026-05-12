"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useWallet } from "../lib/wallet/context";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, Heart, Fire, Rocket, Skull } from "@phosphor-icons/react";

const PRESET_CHEERS = [
  { text: "You've got this! 💪", icon: <Fire size={14} className="text-orange-500" /> },
  { text: "Locked in! 🔥", icon: <Heart size={14} className="text-red-500" /> },
  { text: "Keep pushing! 🚀", icon: <Rocket size={14} className="text-blue-500" /> },
  { text: "Watching you... 👀", icon: <Skull size={14} className="text-black/40" /> },
];

interface Cheer {
  id: string;
  message: string;
  createdAt: string;
  author: {
    username: string | null;
    avatarUrl: string | null;
    walletAddress: string;
  };
}

interface CheerWallProps {
  commitmentId: string;
}

export function CheerWall({ commitmentId }: CheerWallProps) {
  const { wallet } = useWallet();
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchCheers();
  }, [commitmentId]);

  const fetchCheers = async () => {
    try {
      const res = await fetch(`/api/cheers?commitmentId=${commitmentId}`);
      const data = await res.json();
      if (data.ok) {
        setCheers(data.cheers);
      }
    } catch (err) {
      console.error("Failed to fetch cheers", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheer = async (message: string) => {
    if (!wallet?.account.address || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/cheers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitmentId,
          authorWallet: wallet.account.address,
          message,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setCheers((prev) => [data.cheer, ...prev]);
      }
    } catch (err) {
      console.error("Failed to send cheer", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white border border-black/5 rounded-[2rem] p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Megaphone size={20} weight="fill" className="text-oath-gold" />
            <h2 className="text-xl font-black tracking-tight text-black">Arena Cheer Wall</h2>
          </div>
          <p className="text-xs font-mono text-black/40 uppercase tracking-widest">Spectators are watching</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-black text-black">{cheers.length}</p>
          <p className="text-[9px] font-mono text-black/30 uppercase tracking-widest">Total Cheers</p>
        </div>
      </div>

      {/* Preset Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PRESET_CHEERS.map((cheer) => (
          <Button
            key={cheer.text}
            onClick={() => handleCheer(cheer.text)}
            disabled={!wallet || isSending}
            variant="outline"
            className="h-auto py-3 px-4 rounded-xl border-black/5 bg-black/[0.02] hover:bg-black/5 hover:border-black/10 transition-all flex flex-col gap-1 items-center justify-center group"
          >
            <span className="group-hover:scale-110 transition-transform">{cheer.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-black/60">{cheer.text.split(' ')[0]}</span>
          </Button>
        ))}
      </div>

      {!wallet && (
        <div className="p-4 bg-oath-gold/5 border border-oath-gold/10 rounded-xl text-center">
          <p className="text-xs font-medium text-oath-gold/80">Connect wallet to cheer on the maker</p>
        </div>
      )}

      {/* Cheers List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-start gap-3">
                <div className="w-8 h-8 bg-black/5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-black/5 rounded w-1/4" />
                  <div className="h-4 bg-black/5 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : cheers.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 bg-black/[0.02] border border-black/5 rounded-full flex items-center justify-center mx-auto">
              <Megaphone size={20} className="text-black/10" />
            </div>
            <p className="text-xs font-medium text-black/30 italic">No cheers yet. Be the first to shout.</p>
          </div>
        ) : (
          cheers.map((cheer) => (
            <div key={cheer.id} className="flex items-start gap-3 group">
              <Avatar className="w-8 h-8 border border-black/5">
                <AvatarImage src={cheer.author.avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${cheer.author.walletAddress}`} />
                <AvatarFallback className="bg-black/5 text-[10px] font-bold">
                  {cheer.author.username?.slice(0, 2).toUpperCase() || "0X"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-wider text-black">
                    {cheer.author.username || `${cheer.author.walletAddress.slice(0, 4)}...${cheer.author.walletAddress.slice(-4)}`}
                  </p>
                  <p className="text-[9px] font-mono text-black/20">
                    {formatDistanceToNow(new Date(cheer.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <div className="bg-black/[0.02] border border-black/5 rounded-2xl rounded-tl-none p-3 group-hover:bg-black/[0.04] transition-colors">
                  <p className="text-sm font-medium text-black/80">{cheer.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
