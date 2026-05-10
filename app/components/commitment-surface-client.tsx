"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

type CommitmentSurfaceClientProps = {
  commitment: CommitmentDetail | null;
  slug: string;
};

async function fetchCommitmentDetail(
  slug: string,
  walletAddress?: string | null
): Promise<CommitmentDetail> {
  const response = await fetch(
    `/api/commitments/${slug}${
      walletAddress ? `?walletAddress=${encodeURIComponent(walletAddress)}` : ""
    }`,
    { cache: "no-store" }
  );
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
        const nextCommitment = await fetchCommitmentDetail(slug, walletAddress);
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
  }, [commitment, slug, walletAddress]);

  const activeCommitment = commitment
    ? commitment
    : walletAddress && fetchedCommitment?.walletAddress === walletAddress
      ? fetchedCommitment.commitment
      : null;

  const syncCommitment = async () => {
    const nextCommitment = await fetchCommitmentDetail(slug, walletAddress);
    if (walletAddress) {
      setFetchedCommitment({ walletAddress, commitment: nextCommitment });
    }
    return nextCommitment;
  };

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
              Connect the maker wallet to unlock the full commitment, proof feed,
              and private discussion thread.
            </p>
          </div>
          <div className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4 text-sm leading-7 text-muted-foreground">
            Private commitments are maker-only until the owner opens them.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-oath-border bg-card">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20">
              {activeCommitment.category}
            </Badge>
            <Badge variant="outline" className="border-oath-border text-oath-muted-text">
              {activeCommitment.proofType}
            </Badge>
            <Badge variant="outline" className="border-oath-border text-oath-muted-text">
              {activeCommitment.coachToneLabel}
            </Badge>
            {!activeCommitment.isPublic ? (
              <Badge className="bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
                Private
              </Badge>
            ) : null}
            {activeCommitment.makerVerified ? (
              <Badge className="bg-oath-green/10 text-oath-green hover:bg-oath-green/20">
                Verified human
              </Badge>
            ) : null}
          </div>
          <CardTitle className="text-4xl tracking-[-0.04em] sm:text-5xl">
            {activeCommitment.title}
          </CardTitle>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            {activeCommitment.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{activeCommitment.makerHandle}</span>
            <span>·</span>
            <span>{activeCommitment.startDateLabel}</span>
            <span>·</span>
            <span>{activeCommitment.endDateLabel}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-oath-muted-text">
                Day {activeCommitment.proofCount} of {activeCommitment.totalDays}
              </span>
              <span className="font-mono text-oath-black">
                {activeCommitment.progressPercent}%
              </span>
            </div>
            <Progress
              value={activeCommitment.progressPercent}
              className="h-2 transition-all"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Stake" value={activeCommitment.stakeLabel} />
            <Metric label="Believers" value={activeCommitment.believerCount.toString()} />
            <Metric label="Days left" value={activeCommitment.daysRemaining.toString()} />
            <Metric label="Completion" value={activeCommitment.completionRatioLabel} />
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
                    <p className="mt-2 text-sm text-foreground">{activeCommitment.title}</p>
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
            <Button
              variant="outline"
              className="rounded-[var(--radius)] border-oath-border bg-background/40"
              onClick={copyLink}
            >
              Copy link
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-[var(--radius)] text-oath-black hover:bg-oath-gold/10 hover:text-oath-black"
            >
              <Link href={`/api/og/${activeCommitment.slug}`}>OG card</Link>
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
            {activeCommitment.proofSamples.length > 0 ? (
              activeCommitment.proofSamples.map((proof) => (
                <div
                  key={proof.dayNumber}
                  className="rounded-[var(--radius)] border border-oath-border bg-background/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">Day {proof.dayNumber}</p>
                    <p className="text-xs text-oath-muted-text">{proof.createdAtLabel}</p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {proof.textContent}
                  </p>
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
            {activeCommitment.coachMessages.map((message) => (
              <div
                key={message.createdAtLabel + message.content}
                className="rounded-[var(--radius)] border-l-4 border-oath-gold bg-background/40 p-4"
              >
                <p className="text-sm leading-7 text-muted-foreground">{message.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-oath-border bg-card">
          <CardHeader>
            <Badge className="w-fit bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
              Comments
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.03em]">What the crowd is saying</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
              <p className="text-sm font-medium">Add a comment</p>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Leave a comment"
                className="min-h-28 border-oath-border bg-background/50"
              />
              <Button
                onClick={() => submitComment()}
                disabled={isCommenting || comment.trim().length === 0 || !walletAddress}
                className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
              >
                {isCommenting ? "Posting..." : "Post comment"}
              </Button>
            </div>

            {activeCommitment.comments.length > 0 ? (
              <div className="space-y-3">
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
      className={`rounded-[var(--radius)] border border-oath-border bg-background/40 p-4 ${
        depth > 0 ? "ml-4 border-l-2 border-l-oath-gold/40 pl-4" : ""
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
