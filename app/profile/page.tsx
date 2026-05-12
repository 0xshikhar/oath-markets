"use client";

import { useEffect, useState, useTransition } from "react";
import { useWallet } from "../lib/wallet/context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import {
  UserCircle,
  ShieldCheck,
  TrendUp,
  Users,
  Coin,
  ClockCounterClockwise
} from "@phosphor-icons/react/dist/ssr";
import { PublicPageShell } from "../components/public-page-shell";

import Link from "next/link";

type CommitmentItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: string;
  totalDays: number;
  proofCount: number;
};

type BeliefItem = {
  id: string;
  status: string;
  stakeAmountLamports: bigint;
  commitment: {
    slug: string;
    title: string;
  };
};

type ProfileData = {
  id: string;
  walletAddress: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  worldIdVerified: boolean;
  commitments: CommitmentItem[];
  beliefs: BeliefItem[];
  _count: {
    commitments: number;
    beliefs: number;
    followers: number;
    following: number;
  };
};

export default function ProfilePage() {
  const { wallet } = useWallet();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    avatarUrl: "",
  });
  const [isPending, startTransition] = useTransition();

  const walletAddress = wallet?.account.address ? String(wallet.account.address) : null;

  useEffect(() => {
    if (!walletAddress) return;

    async function loadProfile() {
      try {
        const response = await fetch(`/api/profile?walletAddress=${encodeURIComponent(walletAddress!)}`);
        const data = await response.json();
        
        if (response.status === 404) {
          // New user - no profile yet
          setProfile({
            id: "",
            walletAddress: walletAddress!,
            username: null,
            bio: null,
            avatarUrl: null,
            worldIdVerified: false,
            commitments: [],
            beliefs: [],
            _count: { commitments: 0, beliefs: 0, followers: 0, following: 0 }
          });
          setFormData({ username: "", bio: "", avatarUrl: "" });
          setError(null);
        } else if (data.ok) {
          setProfile(data.user);
          setFormData({
            username: data.user.username || "",
            bio: data.user.bio || "",
            avatarUrl: data.user.avatarUrl || "",
          });
          setError(null);
        } else {
          setError(data.error || "Failed to load profile data");
        }
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Network error: Could not connect to the Solana Arena.");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, [walletAddress]);

  const handleUpdate = () => {
    if (!walletAddress) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            ...formData,
          }),
        });
        const data = await response.json();
        if (data.ok) {
          setProfile(data.user);
          setIsEditing(false);
          toast.success("Profile updated successfully");
        } else {
          toast.error(data.error || "Update failed");
        }
      } catch (err: unknown) {
        toast.error("An error occurred");
      }
    });
  };

  if (!walletAddress) {
    return (
      <PublicPageShell
        eyebrow="Identity System"
        title="Your Arena Identity."
        description="Connect your wallet to establish your on-chain reputation and social presence."
      >
        <Card className="mx-auto max-w-xl border-black/5 bg-white shadow-sm">
          <CardContent className="p-12 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-oath-gold/10 flex items-center justify-center">
              <UserCircle size={32} className="text-oath-gold" />
            </div>
            <p className="text-black/40 font-medium">Please connect your wallet to access your profile terminal.</p>
          </CardContent>
        </Card>
      </PublicPageShell>
    );
  }

  if (error) {
    return (
      <PublicPageShell eyebrow="Identity Error" title="Sync Failed." description={error}>
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="size-20 rounded-3xl bg-red-500/10 flex items-center justify-center">
            <ClockCounterClockwise size={40} className="text-red-500" />
          </div>
          <Button 
            onClick={() => {
              setIsLoading(true);
              setError(null);
              window.location.reload();
            }}
            className="bg-black text-white px-8 h-12 rounded-xl font-black uppercase tracking-widest hover:bg-oath-gold hover:text-black transition-all"
          >
            Retry Synchronization
          </Button>
        </div>
      </PublicPageShell>
    );
  }

  if (isLoading || !profile) {
    return (
      <PublicPageShell eyebrow="Identity" title="Syncing Profile." description="Establishing your connection to the Arena terminal...">
        <div className="h-96 rounded-[3rem] bg-black/[0.02] border-2 border-dashed border-black/5 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="size-12 rounded-full border-4 border-black/5 border-t-oath-gold animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Accessing On-chain Identity</p>
          </div>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell
      eyebrow="Arena Identity"
      title={
        profile.username ? (
          <>
            <span className="text-oath-gold italic">@</span>
            {profile.username}
          </>
        ) : (
          "IDENTITY."
        )
      }
      description={profile.bio || "No bio established yet. Set up your identity to build trust in the arena."}
      actions={
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-6 mb-4">
            <div className="size-24 sm:size-32 rounded-[2rem] border-2 border-oath-gold/30 overflow-hidden bg-white shadow-xl">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt={profile.username || ""} width={128} height={128} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-4xl font-black text-black/10">
                  ?
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-black/20">Status</p>
              <Badge className="bg-oath-gold text-black border-oath-gold px-3 py-1 rounded-lg">
                {profile.worldIdVerified ? "VERIFIED" : "UNVERIFIED"}
              </Badge>
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="h-10 sm:h-14 px-5 sm:px-10 bg-black text-white font-black text-[9px] sm:text-xs uppercase tracking-[0.2em] rounded-lg sm:rounded-2xl hover:bg-oath-gold hover:text-black transition-all duration-300 shadow-lg sm:shadow-xl w-fit sm:w-auto self-start"
          >
            {isEditing ? "Cancel Sync" : "Update Identity"}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-8">
          {isEditing ? (
            <Card className="border-black/5 bg-white shadow-xl overflow-hidden">
              <CardHeader className="bg-black/5 border-b border-black/5">
                <CardTitle className="text-xl font-black text-black uppercase tracking-wider">Update Your Identity</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Username</label>
                  <Input 
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="shikhar.sol"
                    className="bg-[#F8F8F8] border-black/10 text-black rounded-xl h-12 focus:border-oath-gold transition-colors"
                  />
                  <p className="text-[10px] text-black/20 font-medium">Unique identifier in the Arena. 3-20 characters.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Bio</label>
                  <Textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Building the future of accountability..."
                    className="bg-[#F8F8F8] border-black/10 text-black rounded-xl min-h-[120px] focus:border-oath-gold transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40">Avatar URL</label>
                  <Input 
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-[#F8F8F8] border-black/10 text-black rounded-xl h-12 focus:border-oath-gold transition-colors"
                  />
                </div>
                <Button 
                  onClick={handleUpdate}
                  disabled={isPending}
                  className="w-full h-14 bg-oath-gold text-black font-black uppercase tracking-widest rounded-2xl shadow-lg hover:scale-[1.01] transition-all"
                >
                  {isPending ? "Syncing..." : "Save Identity Changes"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="commitments" className="w-full">
              <TabsList className="w-full flex sm:grid sm:grid-cols-3 bg-black/5 border border-black/5 p-1 rounded-2xl mb-8 overflow-x-auto sm:overflow-x-hidden no-scrollbar">
                <TabsTrigger value="commitments" className="flex-1 min-w-[100px] rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all">
                  My Oaths
                </TabsTrigger>
                <TabsTrigger value="beliefs" className="flex-1 min-w-[100px] rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all">
                  Co-Stakes
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 min-w-[100px] rounded-xl py-3 data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm text-[9px] sm:text-xs font-black uppercase tracking-widest transition-all">
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="commitments">
                {profile.commitments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.commitments.map((oath) => (
                      <Link key={oath.id} href={`/c/${oath.slug}`}>
                        <Card className="border-black/5 bg-white hover:border-oath-gold transition-all group h-full">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <Badge className={
                                oath.status === "ACTIVE" 
                                  ? "bg-oath-gold text-black" 
                                  : oath.status === "COMPLETED" 
                                    ? "bg-black text-white" 
                                    : "bg-red-500 text-white"
                              }>
                                {oath.status}
                              </Badge>
                              <span className="text-[10px] font-mono font-black text-black/20">
                                {oath.totalDays} DAYS
                              </span>
                            </div>
                            <div>
                              <h3 className="font-black text-black uppercase tracking-tight group-hover:text-oath-gold transition-colors">{oath.title}</h3>
                              <p className="text-xs text-black/40 mt-1 line-clamp-2">{oath.description}</p>
                            </div>
                            <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Proof Count</span>
                              <span className="text-xs font-mono font-black text-black">{oath.proofCount}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="border-black/5 bg-white shadow-sm">
                    <CardContent className="p-20 text-center space-y-6">
                      <div className="mx-auto size-16 rounded-2xl bg-black/5 flex items-center justify-center">
                        <Coin size={32} className="text-black/10" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-black font-bold uppercase tracking-widest">No Active Oaths</p>
                        <p className="text-black/40 text-sm max-w-xs mx-auto">You haven&apos;t opened any arena markets yet. Your commitments will appear here.</p>
                      </div>
                      <Button asChild className="h-12 px-8 bg-black text-white hover:bg-oath-gold hover:text-black rounded-xl text-xs font-black uppercase tracking-widest">
                        <a href="/create">Open Your First Market</a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="beliefs">
                {profile.beliefs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.beliefs.map((belief) => (
                      <Link key={belief.id} href={`/c/${belief.commitment.slug}`}>
                        <Card className="border-black/5 bg-white hover:border-oath-gold transition-all group h-full">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <Badge variant="outline" className="border-black/10 text-black/60 text-[9px]">
                                CO-STAKED
                              </Badge>
                              <Badge className={
                                belief.status === "ACTIVE" 
                                  ? "bg-black text-white" 
                                  : belief.status === "WON" 
                                    ? "bg-oath-gold text-black" 
                                    : "bg-red-500 text-white"
                              }>
                                {belief.status}
                              </Badge>
                            </div>
                            <div>
                              <h3 className="font-black text-black uppercase tracking-tight group-hover:text-oath-gold transition-colors">{belief.commitment.title}</h3>
                              <p className="text-[10px] text-black/30 mt-1 uppercase tracking-widest font-bold">Backing @Maker</p>
                            </div>
                            <div className="pt-4 border-t border-black/5 flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-black/30">Your Belief</span>
                              <span className="text-xs font-mono font-black text-oath-gold">{(Number(belief.stakeAmountLamports) / 1e9).toFixed(2)} SOL</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card className="border-black/5 bg-white shadow-sm">
                    <CardContent className="p-20 text-center space-y-6">
                      <div className="mx-auto size-16 rounded-2xl bg-black/5 flex items-center justify-center">
                        <Users size={32} className="text-black/10" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-black font-bold uppercase tracking-widest">No Co-Stakes</p>
                        <p className="text-black/40 text-sm max-w-xs mx-auto">You aren&apos;t backing any makers yet. Support others to build network reputation.</p>
                      </div>
                      <Button asChild className="h-12 px-8 bg-black text-white hover:bg-oath-gold hover:text-black rounded-xl text-xs font-black uppercase tracking-widest">
                        <a href="/explore">Discover Makers</a>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <aside className="space-y-6">
          {/* Reputation Card */}
          <Card className="border-black/5 bg-white shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-oath-gold/10 to-transparent" />
            <CardHeader className="relative pb-2">
              <div className="flex items-center gap-2">
                <TrendUp size={16} className="text-oath-gold" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40">Reputation Score</span>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="text-center py-6">
                <p className="text-5xl font-black text-black tracking-tighter">740</p>
                <p className="text-[10px] font-black text-oath-gold uppercase tracking-[0.3em] mt-2 bg-black py-1 px-3 rounded-md inline-block">Elite Tier</p>
              </div>
              <div className="grid grid-cols-2 gap-px bg-black/5 rounded-2xl border border-black/5 overflow-hidden">
                <div className="bg-[#F8F8F8] p-5 text-center">
                  <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Followers</p>
                  <p className="text-xl font-mono font-black text-black">{profile?._count?.followers ?? 0}</p>
                </div>
                <div className="bg-[#F8F8F8] p-5 text-center">
                  <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Following</p>
                  <p className="text-xl font-mono font-black text-black">{profile?._count?.following ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Stats */}
          <Card className="border-black/5 bg-white shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-[#F8F8F8] border border-black/5 flex items-center justify-center">
                  <Coin size={20} className="text-oath-gold" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Total Stakes</p>
                  <p className="text-base font-black text-black">{profile?._count?.commitments ?? 0} Oaths</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-xl bg-[#F8F8F8] border border-black/5 flex items-center justify-center">
                  <Users size={20} className="text-oath-gold" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-black/30 uppercase tracking-widest">Belief Impact</p>
                  <p className="text-base font-black text-black">{profile?._count?.beliefs ?? 0} Co-stakes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Status */}
          <div className="p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent opacity-30" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <ShieldCheck size={24} className={profile.worldIdVerified ? "text-oath-gold" : "text-black/20"} />
                <h4 className="text-sm font-black text-black uppercase tracking-wider">Verification</h4>
              </div>
              <p className="text-[11px] text-black/60 leading-relaxed font-medium">
                {profile.worldIdVerified
                  ? "Your identity is sybil-resistant and verified on-chain via World ID."
                  : "Verify with World ID to unlock higher reputation and earn trust in the arena."}
              </p>
              {!profile.worldIdVerified && (
                <Button className="w-full mt-6 bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-xl h-12 shadow-md hover:bg-oath-gold hover:text-black transition-all">
                  Connect World ID
                </Button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </PublicPageShell>
  );
}
