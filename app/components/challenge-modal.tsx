"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useWallet } from "../lib/wallet/context";
import { Megaphone, Sword, Coins, Calendar } from "@phosphor-icons/react";

type ChallengeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetWallet: string;
  targetHandle: string;
};

export function ChallengeModal({ 
  open, 
  onOpenChange, 
  targetWallet, 
  targetHandle 
}: ChallengeModalProps) {
  const { wallet } = useWallet();
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("30");
  const [stake, setStake] = useState("0.1");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!wallet?.account.address) {
      toast.error("Connect your wallet to send a challenge.");
      return;
    }

    if (!goal.trim()) {
      toast.error("Please define a goal for the challenge.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/challenges", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengerWallet: wallet.account.address,
            challengedWallet: targetWallet,
            goal: goal.trim(),
            durationDays: parseInt(duration),
            stakeSol: parseFloat(stake),
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "Failed to create challenge");
        }

        toast.success("Challenge sent!", {
          description: `You've challenged ${targetHandle}. Now share the link to make it official!`,
        });
        
        onOpenChange(false);
        // Reset form
        setGoal("");
        setDuration("30");
        setStake("0.1");
        
        // Optional: Open a share dialog for the new challenge
        const challengeLink = `${window.location.origin}/challenge/${data.challenge.token}`;
        await navigator.clipboard.writeText(challengeLink);
        toast.info("Challenge link copied to clipboard.");

      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Something went wrong");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-black/5 rounded-[2rem] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <Sword size={24} className="text-oath-gold" /> Throw the Gauntlet
          </DialogTitle>
          <DialogDescription className="text-black/40 font-bold uppercase tracking-widest text-[10px]">
            Challenge {targetHandle} to a public commitment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-1.5">
              <Megaphone size={14} /> The Mission
            </label>
            <Textarea
              placeholder="e.g. Run 5km every day, or Ship 10 PRs this week..."
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="min-h-24 bg-black/[0.02] border-black/5 rounded-2xl p-4 focus:ring-oath-gold font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-1.5">
                <Calendar size={14} /> Duration
              </label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-12 bg-black/[0.02] border-black/5 rounded-xl font-bold">
                  <SelectValue placeholder="Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/40 flex items-center gap-1.5">
                <Coins size={14} /> Stake (SOL)
              </label>
              <Input
                type="number"
                step="0.05"
                min="0.05"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                className="h-12 bg-black/[0.02] border-black/5 rounded-xl font-mono font-black"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={isPending || !goal.trim()}
              className="w-full h-14 rounded-2xl bg-black text-white hover:bg-oath-gold hover:text-black font-black uppercase tracking-widest transition-all shadow-lg"
            >
              {isPending ? "Issuing Challenge..." : "Issue Challenge"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
