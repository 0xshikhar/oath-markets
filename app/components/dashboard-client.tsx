"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Address } from "@solana/kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { buildProofContentHash, bytesToHex } from "@/lib/proof-hash";
import {
  getSubmitProofInstructionAsync,
} from "@/lib/generated/oath";
import { getNextOnchainProofDay } from "@/lib/proof-submission";
import {
  getOathProgramUnavailableMessage,
  isOathProgramAvailable,
} from "@/lib/oath-program";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useSolanaClient } from "../lib/solana-client-context";
import type { DashboardView, CommitmentSummary } from "@/lib/oath-data";
import type { SocialPulseResult } from "@/lib/social-data";
import { useCluster } from "./cluster-context";
import { Fire, Trophy, Users, Bell, ChartLineUp } from "@phosphor-icons/react/dist/ssr";

type DashboardApiResponse =
  | {
    ok: true;
    summary: DashboardView;
  }
  | {
    ok: false;
    error?: string;
  };

type SocialPulseApiResponse =
  | (SocialPulseResult & { ok: true })
  | { ok: false; error?: string };

type DashboardClientProps = {
  summary: DashboardView;
};

async function fetchDashboardSummary(
  walletAddress?: string | null
): Promise<DashboardView> {
  const response = await fetch(
    `/api/dashboard/summary${walletAddress ? `?walletAddress=${encodeURIComponent(walletAddress)}` : ""
    }`,
    { cache: "no-store" }
  );
  const data = (await response.json()) as DashboardApiResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      !data.ok && "error" in data
        ? data.error ?? "Unable to load dashboard"
        : "Unable to load dashboard"
    );
  }

  return data.summary;
}

async function fetchSocialPulse(walletAddress: string): Promise<SocialPulseResult> {
  const response = await fetch(`/api/dashboard/pulse?walletAddress=${encodeURIComponent(walletAddress)}`);
  const data = (await response.json()) as SocialPulseApiResponse;
  if (!response.ok || !data.ok) {
    throw new Error("Unable to load social pulse");
  }
  return data;
}

export function DashboardClient({ summary }: DashboardClientProps) {
  const { wallet, signer } = useWallet();
  const { send } = useSendTransaction();
  const { cluster } = useCluster();
  const solanaClient = useSolanaClient();
  const [selectedCommitment, setSelectedCommitment] =
    useState<CommitmentSummary | null>(null);
  const [proofText, setProofText] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [dashboardState, setDashboardState] = useState<{
    walletAddress?: string;
    summary: DashboardView;
    pulse: SocialPulseResult | null;
  }>({
    summary,
    pulse: null,
  });
  const [isPending, startTransition] = useTransition();

  const walletAddress = wallet?.account.address;
  const dashboardSummary =
    walletAddress && dashboardState.walletAddress === walletAddress
      ? dashboardState.summary
      : summary;
  const socialPulse = 
    walletAddress && dashboardState.walletAddress === walletAddress
      ? dashboardState.pulse
      : null;

  const isSummaryLoading =
    Boolean(walletAddress) && dashboardState.walletAddress !== walletAddress;

  const refreshSummary = async () => {
    if (!walletAddress) {
      return;
    }

    const [nextSummary, nextPulse] = await Promise.all([
      fetchDashboardSummary(walletAddress),
      fetchSocialPulse(walletAddress)
    ]);
    setDashboardState({ walletAddress, summary: nextSummary, pulse: nextPulse });
  };

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [nextSummary, nextPulse] = await Promise.all([
          fetchDashboardSummary(walletAddress),
          fetchSocialPulse(walletAddress)
        ]);
        if (!cancelled) {
          setDashboardState({ walletAddress, summary: nextSummary, pulse: nextPulse });
        }
      } catch {
        if (!cancelled) {
          setDashboardState({
            walletAddress,
            summary: { active: [], completed: [], failed: [], inbox: [] },
            pulse: null
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <Card className="border-oath-border bg-card">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your private commitments, proof inbox, and coach threads.
          </p>
          <Button asChild className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90">
            <Link href="/create">Open create page</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSummaryLoading) {
    return (
      <Card className="border-oath-border bg-card">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            Loading your private dashboard...
          </p>
        </CardContent>
      </Card>
    );
  }

  const resetProofForm = () => {
    setSelectedCommitment(null);
    setProofText("");
    setPublicNote("");
    setProofImageFile(null);
    setProofImageUrl(null);
    setIsUploadingImage(false);
  };

  const uploadProofImage = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const sigResponse = await fetch("/api/upload/signature", { method: "POST" });
      const sigData = await sigResponse.json();
      
      if (!sigResponse.ok || !sigData.ok) {
        throw new Error(sigData.error ?? "Failed to get upload signature");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", sigData.folder);
      formData.append("api_key", sigData.apiKey);
      formData.append("timestamp", sigData.timestamp.toString());
      formData.append("signature", sigData.signature);

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadResult = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadResult.secure_url) {
        throw new Error(uploadResult.error?.message ?? "Image upload to Cloudinary failed");
      }

      setProofImageUrl(uploadResult.secure_url);
      toast.success("Image uploaded successfully.");
    } catch (error) {
      setProofImageFile(null);
      setProofImageUrl(null);
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleProofImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setProofImageFile(file);
    setProofImageUrl(null);

    if (file) {
      void uploadProofImage(file);
    }
  };

  const submitProof = () => {
    if (!selectedCommitment) return;
    startTransition(async () => {
      try {
        if (!walletAddress || !signer || !selectedCommitment.onchainAddress) {
          throw new Error("Connect your wallet to submit proof on-chain.");
        }

        if (proofImageFile && !proofImageUrl) {
          throw new Error("Wait for the image upload to finish before submitting.");
        }

        const commitmentAccount = selectedCommitment.onchainAddress as Address;
        const { dayNumber, proofCount: onchainProofCount } = await getNextOnchainProofDay(
          solanaClient.rpc,
          commitmentAccount
        );
        const textContent = proofText.trim();
        const contentHash = await buildProofContentHash({
          commitmentSlug: selectedCommitment.slug,
          dayNumber,
          textContent,
          imageUrl: proofImageUrl,
          publicNote: publicNote.trim() || null,
        });
        let onchainTxSig: string | undefined;
        let fallbackDescription: string | undefined;

        if (walletAddress && signer && selectedCommitment.onchainAddress) {
          const oathProgramAvailable = await isOathProgramAvailable(solanaClient);

          if (oathProgramAvailable) {
            console.log(
              `Submitting proof for Day ${dayNumber} to ${commitmentAccount} (on-chain proof count ${onchainProofCount})`
            );
            const instruction = await getSubmitProofInstructionAsync({
              maker: signer,
              commitmentAccount,
              dayNumber,
              contentHash,
            });
            console.log("Instruction generated:", instruction);
            onchainTxSig = await send({ instructions: [instruction] });
          } else {
            fallbackDescription = getOathProgramUnavailableMessage(cluster);
          }
        }

        const response = await fetch("/api/proofs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commitmentSlug: selectedCommitment.slug,
            walletAddress,
            dayNumber,
            textContent,
            publicNote: publicNote.trim(),
            imageUrl: proofImageUrl,
            contentHash: bytesToHex(contentHash),
            onchainTxSig,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error ?? "Proof failed");
        
        // Milestone Prompt Logic
        const isMilestone = [7, 14, 21, 30, 60, 90, 100].includes(dayNumber);
        if (isMilestone) {
          toast.success(`🔥 MILESTONE REACHED: Day ${dayNumber}!`, {
            description: "Your streak is legendary. Share this moment to rally your believers!",
            duration: 10000,
          });
        } else {
          toast.success(
            onchainTxSig ? "Proof submitted on-chain." : "Proof submitted.",
            fallbackDescription ? { description: fallbackDescription } : undefined
          );
        }

        resetProofForm();
        try {
          await refreshSummary();
        } catch {
          /* keep the successful proof result even if summary refresh fails */
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Proof failed");
      }
    });
  };

  const submitReply = (slug: string) => {
    startTransition(async () => {
      try {
        const content = replyText[slug]?.trim();
        if (!content) return;
        const response = await fetch("/api/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            commitmentSlug: slug,
            walletAddress,
            content,
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error ?? "Reply failed");
        toast.success("Reply sent to the coach thread.");
        setReplyText((current) => ({ ...current, [slug]: "" }));
        try {
          await refreshSummary();
        } catch {
          /* keep the successful reply result even if summary refresh fails */
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Reply failed");
      }
    });
  };

  return (
    <section className="space-y-6">
      <Card className="border-oath-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20">
              Dashboard
            </Badge>
            <CardTitle className="text-3xl tracking-[-0.03em]">Your oaths</CardTitle>
            <p className="text-sm text-muted-foreground">
              The dashboard is where proof submission, coach inbox, and resolution
              tracking will live.
            </p>
          </div>
          <Button asChild className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90">
            <Link href="/create">Create oath</Link>
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active" value={dashboardSummary.active.length.toString()} />
        <Metric label="Completed" value={dashboardSummary.completed.length.toString()} />
        <Metric label="Failed" value={dashboardSummary.failed.length.toString()} />
        <Metric label="Reactions" value={socialPulse?.totalReactionsReceived?.toString() ?? "0"} />
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            Social Arena
            {socialPulse?.notifications && socialPulse.notifications.length > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-oath-gold animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="coach">Coach inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Notifications Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell size={18} className="text-oath-gold" />
                <h3 className="text-sm font-black uppercase tracking-widest text-black/40">Engagement Feed</h3>
              </div>
              
              {socialPulse?.notifications && socialPulse.notifications.length > 0 ? (
                socialPulse.notifications.map((n) => (
                  <Card key={n.id} className="border-black/5 bg-white shadow-sm overflow-hidden group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-black/5 flex items-center justify-center overflow-hidden">
                        {n.actorAvatarUrl ? (
                          <img src={n.actorAvatarUrl} alt={n.actorName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-black">{n.actorName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-black leading-tight">
                          <span className="font-black">{n.actorName}</span>{" "}
                          <span className="text-black/50">{n.title}</span>
                        </p>
                        <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mt-1">
                          {n.actorHandle}
                        </p>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="rounded-lg h-8 px-3 text-[9px] font-black uppercase tracking-widest hover:bg-oath-gold hover:text-black">
                        <Link href={n.publicUrl}>View</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState text="No social activity yet. Share your oaths to attract believers!" />
              )}
            </div>

            {/* Believer Insights Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ChartLineUp size={18} className="text-oath-gold" />
                <h3 className="text-sm font-black uppercase tracking-widest text-black/40">Top Believers</h3>
              </div>

              {socialPulse?.believerInsights && socialPulse.believerInsights.length > 0 ? (
                <Card className="border-black/5 bg-white shadow-sm rounded-[1.5rem] overflow-hidden">
                  <CardContent className="p-0">
                    {socialPulse.believerInsights.map((bi, idx) => (
                      <div key={bi.walletAddress} className={`p-4 flex items-center gap-3 ${idx !== 0 ? "border-t border-black/5" : ""}`}>
                        <div className="size-8 rounded-lg bg-black/5 flex items-center justify-center overflow-hidden shrink-0">
                          {bi.avatarUrl ? (
                            <img src={bi.avatarUrl} alt={bi.handle} className="h-full w-full object-cover" />
                          ) : (
                            <Users size={14} className="text-black/20" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-black truncate">{bi.handle}</p>
                          <p className="text-[9px] font-bold text-oath-gold uppercase tracking-widest">{bi.totalStakedLabel} Staked</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-black">{bi.beliefCount}</p>
                          <p className="text-[8px] font-bold text-black/20 uppercase tracking-widest">Oaths</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-black/5 bg-black/[0.02] border-dashed">
                  <CardContent className="p-8 text-center">
                    <Users size={24} className="mx-auto text-black/10 mb-2" />
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">No believers yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {dashboardSummary.active.map((commitment) => (
            <CommitmentRow
              key={commitment.slug}
              commitment={commitment}
              action={
                <Dialog
                  open={selectedCommitment?.slug === commitment.slug}
                  onOpenChange={(open) =>
                    open ? setSelectedCommitment(commitment) : resetProofForm()
                  }
                >
                  <DialogTrigger asChild>
                    <Button 
                      disabled={commitment.status !== "ACTIVE" || commitment.proofCount >= commitment.totalDays}
                      className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
                    >
                      Submit today&apos;s proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Day {commitment.proofCount + 1} proof</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                          Goal
                        </p>
                        <p className="mt-2 text-sm text-foreground">{commitment.title}</p>
                      </div>
                      <Textarea
                        value={proofText}
                        onChange={(event) => setProofText(event.target.value)}
                        placeholder="Write your proof here"
                        className="min-h-32 border-oath-border bg-background/50"
                      />
                      <Input
                        value={publicNote}
                        onChange={(event) => setPublicNote(event.target.value)}
                        placeholder="Optional public note"
                        className="border-oath-border bg-background/50"
                      />
                      <div className="space-y-2 rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Photo proof</p>
                            <p className="text-xs text-oath-muted-text">
                              Upload an image as proof
                            </p>
                          </div>
                          <Badge variant="outline" className="border-oath-border text-oath-muted-text">
                            Optional
                          </Badge>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleProofImageChange}
                          className="border-oath-border bg-background/50 file:rounded-none file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground"
                        />
                        {isUploadingImage ? (
                          <p className="text-xs text-oath-muted-text">Uploading image...</p>
                        ) : proofImageUrl ? (
                          <p className="text-xs text-oath-green">Image uploaded and ready to attach.</p>
                        ) : proofImageFile ? (
                          <p className="text-xs text-oath-muted-text">{proofImageFile.name}</p>
                        ) : (
                          <p className="text-xs text-oath-muted-text">No image selected.</p>
                        )}
                      </div>
                      <Button
                        onClick={submitProof}
                        disabled={
                          isPending ||
                          isUploadingImage ||
                          proofText.trim().length === 0 ||
                          !walletAddress
                        }
                        className="w-full rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
                      >
                        {isPending ? "Submitting..." : "Submit proof"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              }
            />
          ))}
        </TabsContent>

        <TabsContent value="completed" className="grid gap-4 md:grid-cols-2">
          {dashboardSummary.completed.length > 0 ? (
            dashboardSummary.completed.map((commitment) => (
              <CompletedRow key={commitment.slug} commitment={commitment} />
            ))
          ) : (
            <EmptyState text="No completed oaths yet." />
          )}
        </TabsContent>

        <TabsContent value="failed" className="grid gap-4 md:grid-cols-2">
          {dashboardSummary.failed.length > 0 ? (
            dashboardSummary.failed.map((commitment) => (
              <FailedRow key={commitment.slug} commitment={commitment} />
            ))
          ) : (
            <EmptyState text="No failed oaths yet." />
          )}
        </TabsContent>

        <TabsContent value="coach" className="space-y-4">
          {dashboardSummary.inbox.map((thread) => (
            <Card key={thread.slug} className="border-oath-border bg-card">
              <CardHeader>
                <Badge className="w-fit bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
                  Coach thread
                </Badge>
                <CardTitle className="text-xl tracking-[-0.02em]">{thread.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {thread.messages.map((message) => (
                  <div key={message.content} className="rounded-[var(--radius)] border-l-4 border-oath-gold bg-background/40 p-4">
                    <p className="text-sm leading-7 text-muted-foreground">{message.content}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                      {message.createdAtLabel}
                    </p>
                  </div>
                ))}
                <Textarea
                  value={replyText[thread.slug] ?? ""}
                  onChange={(event) =>
                    setReplyText((current) => ({
                      ...current,
                      [thread.slug]: event.target.value,
                    }))
                  }
                  placeholder="Reply to the coach thread"
                  className="min-h-24 border-oath-border bg-background/50"
                />
                <Button
                  onClick={() => submitReply(thread.slug)}
                  disabled={isPending || !(replyText[thread.slug]?.trim().length)}
                  className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
                >
                  Send reply
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function CommitmentRow({
  commitment,
  action,
}: {
  commitment: CommitmentSummary;
  action: ReactNode;
}) {
  return (
    <Card className="border-oath-border bg-card">
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20">
              {commitment.category}
            </Badge>
            <span className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              Day {commitment.proofCount} of {commitment.totalDays}
            </span>
          </div>
          <p className="text-lg font-medium tracking-[-0.02em]">{commitment.title}</p>
          <p className="text-sm text-muted-foreground">
            {commitment.believerCount} believers · {commitment.stakeLabel} staked · {commitment.daysRemaining} days left
          </p>
        </div>
        <div className="flex flex-wrap gap-3">{action}</div>
      </CardContent>
    </Card>
  );
}

function CompletedRow({ commitment }: { commitment: CommitmentSummary }) {
  return (
    <Card className="border-oath-border bg-card">
      <CardContent className="space-y-3 p-5">
        <Badge className="bg-oath-green/10 text-oath-green hover:bg-oath-green/20">
          Completed
        </Badge>
        <p className="text-lg font-medium">{commitment.title}</p>
        <p className="text-sm text-muted-foreground">
          Final streak: {commitment.totalDays} days · SOL returned · reputation updated
        </p>
      </CardContent>
    </Card>
  );
}

function FailedRow({ commitment }: { commitment: CommitmentSummary }) {
  return (
    <Card className="border-oath-border bg-card">
      <CardContent className="space-y-3 p-5">
        <Badge className="bg-oath-red/10 text-oath-red hover:bg-oath-red/20">
          Failed
        </Badge>
        <p className="text-lg font-medium">{commitment.title}</p>
        <p className="text-sm text-muted-foreground">
          Final streak: {commitment.proofCount} proofs · slash resolution pending
        </p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-oath-border bg-card">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">{label}</p>
        <p className="text-3xl font-semibold tracking-[-0.03em]">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-oath-border bg-card md:col-span-2">
      <CardContent className="p-6 text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
