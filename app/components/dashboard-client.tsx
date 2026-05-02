"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import type { DashboardView, CommitmentSummary } from "@/lib/oath-data";

type DashboardClientProps = {
  summary: DashboardView;
};

export function DashboardClient({ summary }: DashboardClientProps) {
  const { wallet, signer } = useWallet();
  const { send } = useSendTransaction();
  const router = useRouter();
  const [selectedCommitment, setSelectedCommitment] =
    useState<CommitmentSummary | null>(null);
  const [proofText, setProofText] = useState("");
  const [publicNote, setPublicNote] = useState("");
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const walletAddress = wallet?.account.address;

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
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/proof", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        ok: boolean;
        imageUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.ok || !data.imageUrl) {
        throw new Error(data.error ?? "Image upload failed");
      }

      setProofImageUrl(data.imageUrl);
      toast.success("Image uploaded to Cloudinary.");
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
        if (proofImageFile && !proofImageUrl) {
          throw new Error("Wait for the image upload to finish before submitting.");
        }

        const dayNumber = selectedCommitment.proofCount + 1;
        const textContent = proofText.trim();
        const contentHash = await buildProofContentHash({
          commitmentSlug: selectedCommitment.slug,
          dayNumber,
          textContent,
          imageUrl: proofImageUrl,
          publicNote: publicNote.trim() || null,
        });
        let onchainTxSig: string | undefined;

        if (walletAddress && signer && selectedCommitment.onchainAddress) {
          const commitmentAccount = selectedCommitment.onchainAddress as Address;
          const instruction = await getSubmitProofInstructionAsync({
            maker: signer,
            commitmentAccount,
            dayNumber,
            contentHash,
          });
          onchainTxSig = await send({ instructions: [instruction] });
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
        toast.success(onchainTxSig ? "Proof submitted on-chain." : "Proof submitted.");
        resetProofForm();
        router.refresh();
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
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Reply failed");
      }
    });
  };

  return (
    <section className="space-y-6">
      <Card className="border-oath-border/70 bg-oath-surface/80">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-oath-gold/10 text-oath-gold hover:bg-oath-gold/20">
              Dashboard
            </Badge>
            <CardTitle className="text-3xl tracking-[-0.03em]">Your oaths</CardTitle>
            <p className="text-sm text-muted-foreground">
              The dashboard is where proof submission, coach inbox, and resolution
              tracking will live.
            </p>
          </div>
          <Button asChild className="rounded-full bg-oath-gold text-black hover:bg-oath-gold/90">
            <Link href="/create">Create oath</Link>
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Active" value={summary.active.length.toString()} />
        <Metric label="Completed" value={summary.completed.length.toString()} />
        <Metric label="Failed" value={summary.failed.length.toString()} />
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-oath-surface/70">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="coach">Coach inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {summary.active.map((commitment) => (
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
                    <Button className="rounded-full bg-oath-gold text-black hover:bg-oath-gold/90">
                      Submit today&apos;s proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Day {commitment.proofCount + 1} proof</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-oath-border bg-background/40 p-4">
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
                      <div className="space-y-2 rounded-2xl border border-oath-border bg-background/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">Photo proof</p>
                            <p className="text-xs text-oath-muted-text">
                              Upload an image and we store it in Cloudinary.
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
                        className="w-full rounded-full bg-oath-gold text-black hover:bg-oath-gold/90"
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
          {summary.completed.length > 0 ? (
            summary.completed.map((commitment) => (
              <CompletedRow key={commitment.slug} commitment={commitment} />
            ))
          ) : (
            <EmptyState text="No completed oaths yet." />
          )}
        </TabsContent>

        <TabsContent value="failed" className="grid gap-4 md:grid-cols-2">
          {summary.failed.length > 0 ? (
            summary.failed.map((commitment) => (
              <FailedRow key={commitment.slug} commitment={commitment} />
            ))
          ) : (
            <EmptyState text="No failed oaths yet." />
          )}
        </TabsContent>

        <TabsContent value="coach" className="space-y-4">
          {summary.inbox.map((thread) => (
            <Card key={thread.slug} className="border-oath-border/70 bg-oath-surface/80">
              <CardHeader>
                <Badge className="w-fit bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
                  Coach thread
                </Badge>
                <CardTitle className="text-xl tracking-[-0.02em]">{thread.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {thread.messages.map((message) => (
                  <div key={message.content} className="rounded-2xl border-l-4 border-oath-gold bg-background/40 p-4">
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
                  className="rounded-full bg-oath-gold text-black hover:bg-oath-gold/90"
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
    <Card className="border-oath-border/70 bg-oath-surface/80">
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-oath-gold/10 text-oath-gold hover:bg-oath-gold/20">
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
    <Card className="border-oath-border/70 bg-oath-surface/80">
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
    <Card className="border-oath-border/70 bg-oath-surface/80">
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
    <Card className="border-oath-border/70 bg-oath-surface/80">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">{label}</p>
        <p className="text-3xl font-semibold tracking-[-0.03em]">{value}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-oath-border/70 bg-oath-surface/80 md:col-span-2">
      <CardContent className="p-6 text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
