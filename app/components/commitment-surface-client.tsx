"use client";

import type { ChangeEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import type { Address } from "@solana/kit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  findBelieverRecordPda,
  findReputationPda,
  getCoStakeBeliefInstructionAsync,
  getSubmitProofInstructionAsync,
} from "@/lib/generated/oath";
import { sameWalletAddress } from "@/lib/oath-access";
import { buildProofContentHash, bytesToHex } from "@/lib/proof-hash";
import { getNextOnchainProofDay } from "@/lib/proof-submission";
import {
  getOathProgramUnavailableMessage,
  isOathProgramAvailable,
} from "@/lib/oath-program";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useSolanaClient } from "../lib/solana-client-context";
import { useWallet } from "../lib/wallet/context";
import type { CommitmentDetail, CommentThreadNode } from "@/lib/oath-data";
import { useCluster } from "./cluster-context";
import { ProofReactionStrip } from "./proof-reaction-strip";
import { CommitmentShareDialog } from "./share";
import { 
  Fire, 
  Lightning, 
  Users, 
  Coins, 
  Calendar, 
  SealCheck,
  ShareNetwork,
  Clock,
  ChatCircle,
  TrendUp
} from "@phosphor-icons/react";
import { BelieversList } from "./believers-list";
import { CheerWall } from "./cheer-wall";
import { ChallengeModal } from "./challenge-modal";
import { Megaphone } from "@phosphor-icons/react";

type CommitmentSurfaceClientProps = {
  commitment: CommitmentDetail | null;
  slug: string;
  accessToken?: string | null;
};

async function fetchCommitmentDetail(
  slug: string,
  walletAddress?: string | null,
  accessToken?: string | null
): Promise<CommitmentDetail> {
  const params = new URLSearchParams();
  if (walletAddress) {
    params.set("walletAddress", walletAddress);
  }
  if (accessToken) {
    params.set("accessToken", accessToken);
  }
  const query = params.toString();
  const response = await fetch(`/api/commitments/${slug}${query ? `?${query}` : ""}`, {
    cache: "no-store",
  });
  const data = (await response.json()) as {
    ok: boolean;
    commitment?: CommitmentDetail;
    error?: string;
  };

  if (!response.ok || !data.ok || !data.commitment) {
    throw new Error(data.error ?? "Unable to load commitment");
  }

  return data.commitment;
}

export function CommitmentSurfaceClient({
  commitment,
  slug,
  accessToken,
}: CommitmentSurfaceClientProps) {
  const { wallet, signer } = useWallet();
  const { cluster } = useCluster();
  const solanaClient = useSolanaClient();
  const { send } = useSendTransaction();
  const [beliefOpen, setBeliefOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [beliefAmount, setBeliefAmount] = useState("0.1");
  const [isBelieving, setIsBelieving] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [proofText, setProofText] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [fetchedCommitment, setFetchedCommitment] = useState<{
    walletAddress: string;
    commitment: CommitmentDetail;
  } | null>(null);

  const walletAddress = wallet?.account.address;

  useEffect(() => {
    let cancelled = false;

    if (commitment || !walletAddress) {
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const nextCommitment = await fetchCommitmentDetail(
          slug,
          walletAddress,
          accessToken
        );
        if (!cancelled) {
          setFetchedCommitment({ walletAddress, commitment: nextCommitment });
        }
      } catch {
        if (!cancelled) {
          setFetchedCommitment(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accessToken, commitment, slug, walletAddress]);

  const activeCommitment = commitment
    ? commitment
    : walletAddress && fetchedCommitment?.walletAddress === walletAddress
      ? fetchedCommitment.commitment
      : null;

  const syncCommitment = async () => {
    const nextCommitment = await fetchCommitmentDetail(
      slug,
      walletAddress,
      accessToken
    );
    if (walletAddress) {
      setFetchedCommitment({ walletAddress, commitment: nextCommitment });
    }
    return nextCommitment;
  };

  const isMaker =
    Boolean(activeCommitment && walletAddress) &&
    sameWalletAddress(activeCommitment?.makerWalletAddress, walletAddress);
  const isPrivateCommitment = Boolean(activeCommitment && !activeCommitment.isPublic);

  const submitBelief = async () => {
    if (!activeCommitment) {
      toast.error("Open the commitment before believing in it.");
      return;
    }

    try {
      setIsBelieving(true);
      let onchainTxSig: string | undefined;
      let onchainAddress: string | undefined;
      let fallbackDescription: string | undefined;

      if (walletAddress && signer && activeCommitment.onchainAddress) {
        const oathProgramAvailable = await isOathProgramAvailable(solanaClient);

        if (oathProgramAvailable) {
          const commitmentAccount = activeCommitment.onchainAddress as Address;
          const maker = activeCommitment.makerWalletAddress as Address;
          const believerRecord = await findBelieverRecordPda({
            commitmentAccount,
            believerWallet: walletAddress,
          });
          const reputation = await findReputationPda({
            maker,
          });
          const instruction = await getCoStakeBeliefInstructionAsync({
            believerWallet: signer,
            commitmentAccount,
            believerRecord: believerRecord[0],
            reputation: reputation[0],
            stakeLamports: BigInt(
              Math.round(Number(beliefAmount || 0.1) * 1_000_000_000)
            ),
          });

          onchainTxSig = await send({ instructions: [instruction] });
          onchainAddress = believerRecord[0];
        } else {
          fallbackDescription = getOathProgramUnavailableMessage(cluster);
        }
      }

      const response = await fetch("/api/beliefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitmentSlug: activeCommitment.slug,
          walletAddress,
          stakeAmountSol: Number(beliefAmount || 0.1),
          onchainAddress,
          onchainTxSig,
          accessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Belief failed");
      toast.success(
        onchainTxSig ? "Belief staked on-chain." : "Belief staked.",
        fallbackDescription ? { description: fallbackDescription } : undefined
      );
      setBeliefOpen(false);
      try {
        await syncCommitment();
      } catch {
        /* keep the successful belief result even if the refresh fails */
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Belief failed");
    } finally {
      setIsBelieving(false);
    }
  };

  const resetProofForm = () => {
    setProofText("");
    setPublicNote("");
    setProofImageFile(null);
    setProofImageUrl(null);
    setIsUploadingImage(false);
  };

  const uploadProofImage = async (file: File) => {
    setIsUploadingImage(true);
    try {
      console.log("[Cloudinary] Step 1: Requesting signature from server...");
      const sigResponse = await fetch("/api/upload/signature", { method: "POST" });
      console.log("[Cloudinary] Signature response status:", sigResponse.status);
      
      const sigData = await sigResponse.json();
      console.log("[Cloudinary] Signature response data:", sigData);
      
      if (!sigResponse.ok || !sigData.ok) {
        throw new Error(sigData.error ?? "Failed to get upload signature");
      }

      console.log("[Cloudinary] Step 2: Uploading to Cloudinary...", {
        cloudName: sigData.cloudName,
        folder: sigData.folder,
        fileSize: file.size,
        fileType: file.type
      });

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

      console.log("[Cloudinary] Upload response status:", uploadResponse.status);

      const uploadResult = await uploadResponse.json();
      console.log("[Cloudinary] Upload response data:", uploadResult);

      if (!uploadResponse.ok || !uploadResult.secure_url) {
        throw new Error(uploadResult.error?.message ?? "Image upload to Cloudinary failed");
      }

      setProofImageUrl(uploadResult.secure_url);
      console.log("[Cloudinary] SUCCESS! URL:", uploadResult.secure_url);
      toast.success("Image uploaded successfully.");
    } catch (error) {
      console.error("[Cloudinary] ERROR:", error);
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
    if (!activeCommitment) return;
    startTransition(async () => {
      try {
        if (!walletAddress || !signer || !activeCommitment.onchainAddress) {
          throw new Error("Connect your wallet to submit proof on-chain.");
        }

        if (proofImageFile && !proofImageUrl) {
          throw new Error("Wait for the image upload to finish before submitting.");
        }

        const commitmentAccount = activeCommitment.onchainAddress as Address;
        const { dayNumber, proofCount: onchainProofCount } = await getNextOnchainProofDay(
          solanaClient.rpc,
          commitmentAccount
        );
        const textContent = proofText.trim();
        const contentHash = await buildProofContentHash({
          commitmentSlug: activeCommitment.slug,
          dayNumber,
          textContent,
          imageUrl: proofImageUrl,
          publicNote: publicNote.trim() || null,
        });
        let onchainTxSig: string | undefined;
        let fallbackDescription: string | undefined;

        if (walletAddress && signer && activeCommitment.onchainAddress) {
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
            commitmentSlug: activeCommitment.slug,
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
        toast.success(
          onchainTxSig ? "Proof submitted on-chain." : "Proof submitted.",
          fallbackDescription ? { description: fallbackDescription } : undefined
        );
        resetProofForm();
        try {
          await syncCommitment();
        } catch {
          /* keep the successful proof result even if summary refresh fails */
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Proof failed");
      }
    });
  };

  const submitComment = async (parentCommentId?: string) => {
    const content = parentCommentId
      ? replyDrafts[parentCommentId]?.trim()
      : comment.trim();

    if (!content || !activeCommitment) {
      return;
    }

    try {
      setIsCommenting(true);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitmentSlug: activeCommitment.slug,
          walletAddress,
          content,
          parentCommentId,
          accessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Comment failed");
      toast.success(parentCommentId ? "Reply posted." : "Comment posted.");
      if (parentCommentId) {
        setReplyDrafts((current) => ({
          ...current,
          [parentCommentId]: "",
        }));
        setActiveReplyId(null);
      } else {
        setComment("");
      }
      try {
        await syncCommitment();
      } catch {
        /* keep the successful comment result even if the refresh fails */
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Comment failed");
    } finally {
      setIsCommenting(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied.");
  };

  const createPrivateShareLink = async () => {
    if (!walletAddress || !activeCommitment) {
      toast.error("Connect the maker wallet to create a private link.");
      return;
    }

    try {
      setIsGeneratingShareLink(true);
      const response = await fetch(`/api/commitments/${activeCommitment.slug}/private-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        shareUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.shareUrl) {
        throw new Error(data.error ?? "Unable to create private link");
      }

      await navigator.clipboard.writeText(data.shareUrl);
      toast.success("Private link copied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create private link");
    } finally {
      setIsGeneratingShareLink(false);
    }
  };

  if (!activeCommitment) {
    return (
      <Card className="border-oath-border bg-card">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
              Private commitment
            </Badge>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">
              This oath is private.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              Connect the maker wallet or open a private access link to unlock the
              full commitment, proof feed, and private discussion thread.
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4 text-sm leading-7 text-muted-foreground">
            Private commitments stay out of the public feed until the maker shares an
            access link.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-8">
        <Card className="border-black/5 bg-white overflow-hidden shadow-sm">
          <CardHeader className="p-8 pb-4">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Badge className="bg-oath-gold text-black border-transparent text-[9px] font-black uppercase tracking-widest px-3 py-1">
                {activeCommitment.category}
              </Badge>
              <Badge variant="outline" className="border-black/5 text-black/40 text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-black/[0.02]">
                {activeCommitment.proofType}
              </Badge>
              {activeCommitment.isAtRisk && (
                <Badge className="bg-red-500 text-white border-transparent text-[9px] font-black uppercase tracking-widest px-3 py-1 animate-pulse">
                  At Risk
                </Badge>
              )}
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-black uppercase leading-[0.9] mb-6">
              {activeCommitment.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 py-6 border-y border-black/5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-black/5 flex items-center justify-center overflow-hidden border border-black/5">
                  <span className="text-sm font-black text-black/20">{activeCommitment.makerName[0]}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-black/40 uppercase tracking-widest">Maker</span>
                  <span className="text-sm font-bold text-black flex items-center gap-1">
                    {activeCommitment.makerHandle}
                    {activeCommitment.makerVerified && <SealCheck size={14} weight="fill" className="text-oath-gold" />}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-black/5 flex items-center justify-center border border-black/5">
                  <Clock size={20} weight="fill" className="text-black/20" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-black/40 uppercase tracking-widest">Timeline</span>
                  <span className="text-sm font-bold text-black">{activeCommitment.startDateLabel} — {activeCommitment.endDateLabel}</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 pt-4 space-y-8">
            <div className="grid gap-4 sm:grid-cols-4">
              <MetricItem icon={<Coins weight="fill" />} label="Stake" value={activeCommitment.stakeLabel} />
              <MetricItem icon={<Users weight="fill" />} label="Believers" value={activeCommitment.believerCount.toString()} />
              <MetricItem icon={<Calendar weight="fill" />} label="Days Left" value={activeCommitment.daysRemaining.toString()} />
              <MetricItem icon={<TrendUp weight="fill" />} label="Progress" value={`${activeCommitment.progressPercent}%`} />
            </div>

            <div className="relative pt-2">
              <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest">
                <span className="text-black/40">Arena Progress</span>
                <span className="text-black">Day {activeCommitment.proofCount} of {activeCommitment.totalDays}</span>
              </div>
              <Progress value={activeCommitment.progressPercent} className="h-3 bg-black/5 [&>div]:bg-oath-gold rounded-full" />
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Dialog open={beliefOpen} onOpenChange={setBeliefOpen}>
                <DialogTrigger asChild>
                  <Button className="h-12 rounded-2xl bg-oath-gold text-black hover:bg-black hover:text-oath-gold transition-all px-8 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-oath-gold/20">
                    Believe in them
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg bg-white border-black/5 rounded-[2rem]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Co-Stake on Faith</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="p-5 bg-black/[0.02] rounded-2xl border border-black/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-black/30 mb-2">Target Commitment</p>
                      <p className="text-sm font-bold text-black">{activeCommitment.title}</p>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Stake Amount (SOL)</p>
                      <Input
                        type="number"
                        step="0.05"
                        min="0.05"
                        value={beliefAmount}
                        onChange={(event) => setBeliefAmount(event.target.value)}
                        className="h-14 bg-white border-black/10 rounded-2xl font-mono font-black text-lg focus:ring-oath-gold"
                      />
                    </div>
                    <Button
                      onClick={submitBelief}
                      disabled={isBelieving || !walletAddress}
                      className="w-full h-14 rounded-2xl bg-oath-gold text-black hover:bg-black hover:text-oath-gold font-black uppercase tracking-widest transition-all"
                    >
                      {isBelieving ? "Processing..." : "Confirm Co-Stake"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {isMaker && activeCommitment.status === "ACTIVE" && activeCommitment.proofCount < activeCommitment.totalDays && (
                <Dialog onOpenChange={(open) => !open && resetProofForm()}>
                  <DialogTrigger asChild>
                    <Button className="h-12 rounded-2xl bg-black text-white hover:bg-oath-gold hover:text-black transition-all px-8 font-black uppercase tracking-widest text-[11px]">
                      Submit proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg bg-white border-black/5 rounded-[2rem]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black uppercase tracking-tight">Daily Arena Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                      <Textarea
                        value={proofText}
                        onChange={(event) => setProofText(event.target.value)}
                        placeholder="What did you achieve today?"
                        className="min-h-40 bg-white border-black/10 rounded-2xl p-5 focus:ring-oath-gold font-medium"
                      />
                      <div className="p-6 bg-black/[0.02] rounded-2xl border border-black/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
                            Visual Proof (Optional)
                          </p>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleProofImageChange}
                          className="bg-white border-black/10 rounded-xl"
                        />
                      </div>
                      <Button
                        onClick={submitProof}
                        disabled={isPending || isUploadingImage || proofText.trim().length === 0}
                        className="w-full h-14 rounded-2xl bg-black text-white hover:bg-oath-gold hover:text-black font-black uppercase tracking-widest transition-all"
                      >
                        {isPending ? "Broadcasting..." : "Publish to Arena"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button
                variant="outline"
                className="h-12 rounded-2xl border-black/5 bg-white hover:bg-black hover:text-white transition-all px-6 font-black uppercase tracking-widest text-[10px]"
                onClick={() => setShareOpen(true)}
              >
                <ShareNetwork size={16} className="mr-2" /> Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Proof Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
              <Lightning size={14} weight="fill" /> Arena Timeline
            </h2>
            <Badge variant="outline" className="border-black/5 text-black/20 text-[9px] font-black uppercase tracking-widest">
              Live Feed
            </Badge>
          </div>

          <div className="space-y-4">
            {activeCommitment.proofSamples.length > 0 ? (
              activeCommitment.proofSamples.map((proof) => (
                <div
                  key={proof.id}
                  className="bg-white rounded-[2rem] border border-black/5 p-8 hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-oath-gold flex items-center justify-center border border-black/5">
                        <span className="text-[10px] font-black text-black">DAY {proof.dayNumber}</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-black/20">{proof.createdAtLabel}</span>
                    </div>
                    <ProofReactionStrip
                      proofId={proof.id}
                      initialCounts={proof.reactionCounts}
                    />
                  </div>
                  
                  <p className="text-lg font-medium leading-relaxed text-black/80 mb-6">
                    {proof.textContent}
                  </p>

                  {proof.imageUrl && (
                    <div className="rounded-[1.5rem] overflow-hidden border border-black/5 mb-6">
                      <img src={proof.imageUrl} alt={`Day ${proof.dayNumber} proof`} className="w-full h-auto" />
                    </div>
                  )}

                  {proof.publicNote && (
                    <div className="flex items-start gap-2 p-4 bg-black/[0.02] rounded-xl border border-black/5">
                      <ChatCircle size={14} className="text-black/40 mt-0.5" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/30">
                        Coach Note: {proof.publicNote}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-20 text-center bg-white rounded-[2rem] border border-dashed border-black/10">
                <Lightning size={48} className="mx-auto mb-4 text-black/5" />
                <p className="text-xs font-black uppercase tracking-widest text-black/20">The timeline is empty</p>
                <p className="text-sm font-medium text-black/10 mt-1">Waiting for the first spark of progress.</p>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-2">
              <ChatCircle size={14} weight="fill" /> Tribe Discussion
            </h2>
          </div>

          <Card className="border-black/5 bg-white p-8 rounded-[2rem] shadow-sm">
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Add to the conversation</p>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What's your take?"
                  className="min-h-32 bg-black/[0.02] border-black/5 rounded-2xl p-5 focus:ring-oath-gold font-medium"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={() => submitComment()}
                    disabled={isCommenting || comment.trim().length === 0 || !walletAddress}
                    className="h-12 rounded-2xl bg-black text-white hover:bg-oath-gold hover:text-black transition-all px-8 font-black uppercase tracking-widest text-[10px]"
                  >
                    {isCommenting ? "Broadcasting..." : "Post Comment"}
                  </Button>
                </div>
              </div>

              {activeCommitment.comments.length > 0 ? (
                <div className="space-y-6 pt-6 border-t border-black/5">
                  {activeCommitment.comments.map((commentItem) => (
                    <CommentThread
                      key={commentItem.id}
                      node={commentItem}
                      depth={0}
                      activeReplyId={activeReplyId}
                      replyDrafts={replyDrafts}
                      onReplyChange={(commentId, value) =>
                        setReplyDrafts((current) => ({
                          ...current,
                          [commentId]: value,
                        }))
                      }
                      onStartReply={setActiveReplyId}
                      onCancelReply={() => setActiveReplyId(null)}
                      onSubmitReply={(commentId) => submitComment(commentId)}
                      isSubmitting={isCommenting}
                      walletConnected={Boolean(walletAddress)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center bg-black/[0.01] rounded-2xl border border-dashed border-black/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Silence in the arena</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="space-y-8">
        <Card className="border-black/5 bg-white p-8 rounded-[2rem] shadow-sm">
          <BelieversList believers={activeCommitment.believers} totalCount={activeCommitment.believerCount} />
        </Card>

        <Card className="border-black/5 bg-white p-8 rounded-[2rem] shadow-sm">
          <CheerWall commitmentId={activeCommitment.id} />
        </Card>

        {activeCommitment.coachMessages.length > 0 && (
          <Card className="border-black/5 bg-black p-8 rounded-[2rem] shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <SealCheck size={14} weight="fill" className="text-oath-gold" /> AI Coach's Take
            </h3>
            <div className="space-y-6">
              {activeCommitment.coachMessages.map((message, idx) => (
                <div key={idx} className="space-y-2 border-l-2 border-oath-gold/30 pl-4 py-1">
                  <p className="text-sm font-medium text-white leading-relaxed">{message.content}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{message.createdAtLabel}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!isMaker && (
          <>
            <Button 
              className="w-full h-14 rounded-2xl bg-black text-white hover:bg-oath-gold hover:text-black font-black uppercase tracking-widest transition-all border border-black/5 flex items-center gap-2"
              onClick={() => setChallengeOpen(true)}
            >
              <Megaphone size={18} weight="fill" /> Challenge Maker
            </Button>
            {activeCommitment && (
              <ChallengeModal
                open={challengeOpen}
                onOpenChange={setChallengeOpen}
                targetWallet={activeCommitment.makerWalletAddress}
                targetHandle={activeCommitment.makerHandle}
              />
            )}
          </>
        )}
      </div>

      {activeCommitment && (
        <CommitmentShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          commitment={activeCommitment}
        />
      )}
    </section>
  );
}

function CommentThread({
  node,
  depth,
  activeReplyId,
  replyDrafts,
  onReplyChange,
  onStartReply,
  onCancelReply,
  onSubmitReply,
  isSubmitting,
  walletConnected,
}: {
  node: CommentThreadNode;
  depth: number;
  activeReplyId: string | null;
  replyDrafts: Record<string, string>;
  onReplyChange: (commentId: string, value: string) => void;
  onStartReply: (commentId: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (commentId: string) => void;
  isSubmitting: boolean;
  walletConnected: boolean;
}) {
  const isReplyOpen = activeReplyId === node.id;
  const replyValue = replyDrafts[node.id] ?? "";

  return (
    <div
      className={`rounded-[var(--radius)] border border-oath-border bg-background/40 p-5 ${depth > 0 ? "ml-4 border-l-2 border-l-oath-gold/40 pl-4" : ""
        }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{node.authorName}</p>
        <p className="text-xs text-oath-muted-text">{node.createdAtLabel}</p>
      </div>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{node.content}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-8 rounded-[var(--radius)] px-3 text-xs text-oath-black hover:bg-oath-gold/10"
          onClick={() => onStartReply(node.id)}
          disabled={!walletConnected}
        >
          Reply
        </Button>
        {depth > 0 ? (
          <Badge variant="outline" className="border-oath-border text-oath-muted-text">
            Reply
          </Badge>
        ) : null}
      </div>

      {isReplyOpen ? (
        <div className="mt-4 space-y-2">
          <Textarea
            value={replyValue}
            onChange={(event) => onReplyChange(node.id, event.target.value)}
            placeholder="Write a reply"
            className="min-h-24 border-oath-border bg-background/50"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => onSubmitReply(node.id)}
              disabled={isSubmitting || replyValue.trim().length === 0 || !walletConnected}
              className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
            >
              {isSubmitting ? "Posting..." : "Post reply"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-[var(--radius)] border-oath-border bg-background/40"
              onClick={onCancelReply}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {node.replies.length > 0 ? (
        <div className="mt-4 space-y-3">
          {node.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              node={reply}
              depth={depth + 1}
              activeReplyId={activeReplyId}
              replyDrafts={replyDrafts}
              onReplyChange={onReplyChange}
              onStartReply={onStartReply}
              onCancelReply={onCancelReply}
              onSubmitReply={onSubmitReply}
              isSubmitting={isSubmitting}
              walletConnected={walletConnected}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MetricItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 bg-black/[0.02] rounded-2xl border border-black/5">
      <p className="text-[9px] font-black uppercase tracking-widest text-black/30 flex items-center gap-1.5 mb-1">
        <span className="text-black/10">{icon}</span> {label}
      </p>
      <p className="text-sm font-mono font-black text-black">{value}</p>
    </div>
  );
}
