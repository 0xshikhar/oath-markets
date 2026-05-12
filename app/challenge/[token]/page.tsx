"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useWallet } from "../../lib/wallet/context";
import { toast } from "sonner";
import { PublicPageShell } from "../../components/public-page-shell";
import { Trophy, Coins, Calendar, CheckCircle, SealCheck } from "@phosphor-icons/react";

interface Challenge {
  goal: string;
  stakeSol: number;
  durationDays: number;
  status: string;
  token: string;
  challenger: {
    username: string | null;
    avatarUrl: string | null;
    walletAddress: string;
  };
  challenged: {
    username: string | null;
    avatarUrl: string | null;
    walletAddress: string;
    verified: boolean;
  };
}

export default function ChallengePage() {
  const { token } = useParams();
  const router = useRouter();
  const { wallet } = useWallet();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (token) {
      fetch(`/api/challenges?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.ok) {
            setChallenge(data.challenge);
          } else {
            toast.error(data.error || "Challenge not found");
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  const handleAccept = async () => {
    if (!wallet || !challenge) {
      toast.error("Connect your wallet to accept the challenge");
      return;
    }

    if (wallet.account.address !== challenge.challenged.walletAddress) {
      toast.error("This challenge was not intended for you.");
      return;
    }

    setIsAccepting(true);
    try {
      // In a real scenario, this would involve a Solana transaction to stake SOL.
      // For the demo, we'll simulate the successful acceptance.
      const res = await fetch(`/api/challenges/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: wallet.account.address }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Challenge Accepted! Redirecting to your new oath...");
        router.push(`/c/${data.commitmentSlug}`);
      } else {
        throw new Error(data.error || "Failed to accept challenge");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message);
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-oath-gold" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-black uppercase">Challenge Not Found</h1>
        <Button onClick={() => router.push("/explore")} className="mt-4">Go Explore</Button>
      </div>
    );
  }

  const isExpired = challenge.status === "EXPIRED";
  const isAccepted = challenge.status === "ACCEPTED";

  return (
    <PublicPageShell
      eyebrow="Arena Challenge"
      title="A gauntlet has been thrown."
      description="Peer-to-peer accountability with real stakes. Accept the challenge to prove your discipline."
    >
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-black/10 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8">
            <Trophy size={48} weight="fill" className="text-oath-gold/10" />
          </div>

          <CardHeader className="p-10 pb-4">
            <div className="flex items-center gap-4 mb-8">
              <Avatar className="w-12 h-12 border-2 border-oath-gold">
                <AvatarImage src={challenge.challenger.avatarUrl ?? undefined} />
                <AvatarFallback className="bg-black text-white font-black">
                  {challenge.challenger.username?.slice(0, 2).toUpperCase() || "0X"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-oath-gold mb-1">Challenger</p>
                <h3 className="text-lg font-black text-black">
                  {challenge.challenger.username || "Anonymous"} 
                  <span className="text-black/30 font-medium ml-2">sent you a challenge</span>
                </h3>
              </div>
            </div>

            <div className="bg-black/[0.02] border border-black/5 rounded-3xl p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/30">The Goal</p>
                <p className="text-2xl font-black text-black leading-tight">&quot;{challenge.goal}&quot;</p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-black/5">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black/30 flex items-center gap-1.5">
                    <Coins size={12} weight="fill" className="text-oath-gold" /> Stake
                  </p>
                  <p className="text-lg font-mono font-black text-black">{challenge.stakeSol} SOL</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-black/30 flex items-center gap-1.5">
                    <Calendar size={12} weight="fill" className="text-black/20" /> Duration
                  </p>
                  <p className="text-lg font-mono font-black text-black">{challenge.durationDays} Days</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-10 pt-6 space-y-8">
            {isAccepted ? (
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 flex items-center gap-4">
                <CheckCircle size={24} weight="fill" className="text-green-500" />
                <div>
                  <p className="text-sm font-black uppercase text-green-700">Challenge Accepted</p>
                  <p className="text-xs font-medium text-green-600/80">This challenge has already been converted into an active oath.</p>
                </div>
              </div>
            ) : isExpired ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-sm font-black uppercase text-red-700">Challenge Expired</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-oath-gold/5 border border-oath-gold/10 rounded-3xl">
                  <p className="text-sm font-medium text-black/70 leading-relaxed italic">
                    &quot;Accepting this challenge requires you to stake {challenge.stakeSol} SOL. You must submit proof every day for {challenge.durationDays} days. If you fail, your stake will be slashed.&quot;
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleAccept}
                    disabled={isAccepting || !wallet}
                    className="flex-1 h-16 rounded-2xl bg-oath-gold text-black hover:bg-black hover:text-oath-gold font-black uppercase tracking-widest transition-all text-sm shadow-xl shadow-oath-gold/20"
                  >
                    {isAccepting ? "Accepting Challenge..." : "Accept & Stake SOL"}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-16 rounded-2xl border-black/10 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all font-black uppercase tracking-widest text-xs px-8"
                  >
                    Decline
                  </Button>
                </div>
                
                {!wallet && (
                  <p className="text-center text-[10px] font-black uppercase tracking-widest text-black/30">
                    Connect wallet to accept the challenge
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-12 text-center space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20">The Maker</p>
          <div className="flex items-center justify-center gap-3">
            <Avatar className="w-8 h-8 border border-black/5">
              <AvatarImage src={challenge.challenged.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-black/5 font-bold">
                {challenge.challenged.username?.slice(0, 2).toUpperCase() || "0X"}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-bold text-black">
              {challenge.challenged.username || challenge.challenged.walletAddress.slice(0, 8)}
              {challenge.challenged.verified && <SealCheck size={14} weight="fill" className="text-oath-gold ml-1 inline" />}
            </p>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
