"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "@/lib/generated/oath";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import { useWallet } from "../lib/wallet/context";
import type { CommitmentDetail } from "@/lib/oath-data";
import { ProofReactionStrip } from "./proof-reaction-strip";

type CommitmentSurfaceClientProps = {
  commitment: CommitmentDetail;
};

export function CommitmentSurfaceClient({ commitment }: CommitmentSurfaceClientProps) {
  const { wallet, signer } = useWallet();
  const router = useRouter();
  const { send } = useSendTransaction();
  const [beliefOpen, setBeliefOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [beliefAmount, setBeliefAmount] = useState("0.1");
  const [isBelieving, setIsBelieving] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const walletAddress = wallet?.account.address;

  const submitBelief = async () => {
    try {
      setIsBelieving(true);
      let onchainTxSig: string | undefined;
      let onchainAddress: string | undefined;

      if (walletAddress && signer && commitment.onchainAddress) {
        const commitmentAccount = commitment.onchainAddress as Address;
        const maker = commitment.makerWalletAddress as Address;
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
          stakeLamports: BigInt(Math.round(Number(beliefAmount || 0.1) * 1_000_000_000)),
        });

        onchainTxSig = await send({ instructions: [instruction] });
        onchainAddress = believerRecord[0];
      }

      const response = await fetch("/api/beliefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitmentSlug: commitment.slug,
          walletAddress,
          stakeAmountSol: Number(beliefAmount || 0.1),
          onchainAddress,
          onchainTxSig,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Belief failed");
      toast.success(onchainTxSig ? "Belief staked on-chain." : "Belief staked.");
      setBeliefOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Belief failed");
    } finally {
      setIsBelieving(false);
    }
  };

  const submitComment = async () => {
    try {
      setIsCommenting(true);
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitmentSlug: commitment.slug,
          walletAddress,
          content: comment,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Comment failed");
      toast.success("Comment posted.");
      setComment("");
      router.refresh();
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

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-oath-border bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20">
              {commitment.category}
            </Badge>
            <Badge variant="outline" className="border-oath-border text-oath-muted-text">
              {commitment.proofType}
            </Badge>
            {commitment.makerVerified ? (
              <Badge className="bg-oath-green/10 text-oath-green hover:bg-oath-green/20">
                Verified human
              </Badge>
            ) : null}
          </div>
          <CardTitle className="text-4xl tracking-[-0.04em] sm:text-5xl">
            {commitment.title}
          </CardTitle>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {commitment.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{commitment.makerHandle}</span>
            <span>·</span>
            <span>{commitment.startDateLabel}</span>
            <span>·</span>
            <span>{commitment.endDateLabel}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-oath-muted-text">
                Day {commitment.proofCount} of {commitment.totalDays}
              </span>
              <span className="font-mono text-oath-black">{commitment.progressPercent}%</span>
            </div>
            <Progress value={commitment.progressPercent} className="h-2 transition-all" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Stake" value={commitment.stakeLabel} />
            <Metric label="Believers" value={commitment.believerCount.toString()} />
            <Metric label="Days left" value={commitment.daysRemaining.toString()} />
            <Metric label="Completion" value={commitment.completionRatioLabel} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Dialog open={beliefOpen} onOpenChange={setBeliefOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90">
                  Believe in them
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Believe in this oath</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                      Commitment
                    </p>
                    <p className="mt-2 text-sm text-foreground">{commitment.title}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Belief amount</p>
                    <Input
                      type="number"
                      step="0.05"
                      min="0.05"
                      value={beliefAmount}
                      onChange={(event) => setBeliefAmount(event.target.value)}
                      className="border-oath-border bg-background/50"
                    />
                  </div>
                  <div className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4 text-sm leading-7 text-muted-foreground">
                    Your stake returns on failure. On success, believers share the faith fee.
                  </div>
                  <Button
                    onClick={submitBelief}
                    disabled={isBelieving || !walletAddress}
                    className="w-full rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
                  >
                    {isBelieving ? "Staking..." : "Believe in them"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="rounded-[var(--radius)] border-oath-border bg-background/40" onClick={copyLink}>
              Copy link
            </Button>
            <Button asChild variant="ghost" className="rounded-[var(--radius)] text-oath-black hover:bg-oath-gold/10 hover:text-oath-black">
              <Link href={`/api/og/${commitment.slug}`}>OG card</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-oath-border bg-card">
          <CardHeader>
            <Badge className="w-fit bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
              Proof feed
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.03em]">Daily updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {commitment.proofSamples.length > 0 ? (
              commitment.proofSamples.map((proof) => (
                <div key={proof.dayNumber} className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">Day {proof.dayNumber}</p>
                    <p className="text-xs text-oath-muted-text">{proof.createdAtLabel}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{proof.textContent}</p>
                  {proof.imageUrl ? (
                    <a
                      href={proof.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block overflow-hidden rounded-[var(--radius)] border border-oath-border"
                    >
                      <div
                        className="h-48 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${proof.imageUrl})` }}
                        aria-label={`Proof day ${proof.dayNumber}`}
                      />
                    </a>
                  ) : null}
                  {proof.linkUrl ? (
                    <a
                      href={proof.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-[var(--radius)] border border-oath-border px-3 py-1 text-xs text-oath-black hover:bg-oath-gold/10"
                    >
                      Open link
                    </a>
                  ) : null}
                  {proof.publicNote ? (
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                      {proof.publicNote}
                    </p>
                  ) : null}
                  <div className="mt-4">
                    <ProofReactionStrip
                      proofId={proof.id}
                      initialCounts={proof.reactionCounts}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4 text-sm text-muted-foreground">
                No proof yet. This streak will light up when the first update lands.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-oath-border bg-card">
          <CardHeader>
            <Badge className="w-fit bg-oath-green/10 text-oath-green hover:bg-oath-green/20">
              Coach notes
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.03em]">Immediate response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {commitment.coachMessages.map((message) => (
              <div key={message.createdAtLabel + message.content} className="rounded-[var(--radius)] border-l-4 border-oath-gold bg-background/40 p-4">
                <p className="text-sm leading-7 text-muted-foreground">{message.content}</p>
              </div>
            ))}
            <div className="space-y-2">
              <p className="text-sm font-medium">Comment on the streak</p>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Leave a public comment"
                className="min-h-28 border-oath-border bg-background/50"
              />
              <Button
                onClick={submitComment}
                disabled={isCommenting || comment.trim().length === 0 || !walletAddress}
                className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
              >
                {isCommenting ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-oath-border bg-card">
          <CardHeader>
            <Badge className="w-fit bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
              Comments
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.03em]">What the crowd is saying</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {commitment.comments.length > 0 ? (
              commitment.comments.map((commentItem) => (
                <div
                  key={commentItem.createdAtLabel + commentItem.content}
                  className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {commentItem.authorName}
                    </p>
                    <p className="text-xs text-oath-muted-text">
                      {commentItem.createdAtLabel}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {commentItem.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4 text-sm text-muted-foreground">
                No comments yet. Be the first to react.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}
