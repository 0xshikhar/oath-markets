"use client";

import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useWallet } from "../lib/wallet/context";
import type { CommitmentSummary } from "@/lib/oath-data";

const categories = [
  "FITNESS",
  "LEARNING",
  "CREATIVE",
  "WORK",
  "HEALTH",
  "FINANCIAL",
  "CUSTOM",
] as const;

const proofTypes = ["TEXT", "PHOTO", "LINK", "GITHUB_COMMIT", "CUSTOM"] as const;
const visibilityOptions = ["PUBLIC", "PRIVATE"] as const;
const toneOptions = [
  "Drill Sergeant",
  "Supportive Friend",
  "Neutral Analyst",
] as const;
const slashOptions = ["BURN", "DONATE", "TREASURY"] as const;

type WizardState = {
  title: string;
  description: string;
  category: (typeof categories)[number];
  proofType: (typeof proofTypes)[number];
  durationDays: number;
  stakeAmountSol: number;
  visibility: (typeof visibilityOptions)[number];
  tone: (typeof toneOptions)[number];
  slashDestination: (typeof slashOptions)[number];
  notifyTime: string;
  timezone: string;
  worldIdVerified: boolean;
};

const steps = [
  "Goal",
  "Duration",
  "Stake",
  "Visibility",
  "Coach",
  "Review",
] as const;

const defaultState: WizardState = {
  title: "Ship one public build note every day for 30 days",
  description:
    "Short proof, one screenshot, one sentence about the thing that moved forward.",
  category: "WORK",
  proofType: "TEXT",
  durationDays: 30,
  stakeAmountSol: 1,
  visibility: "PUBLIC",
  tone: "Supportive Friend",
  slashDestination: "TREASURY",
  notifyTime: "09:00",
  timezone: "Asia/Kolkata",
  worldIdVerified: false,
};

export function CreateWizard() {
  const router = useRouter();
  const { wallet } = useWallet();
  const [step, setStep] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<WizardState>(defaultState);
  const [createdCommitment, setCreatedCommitment] =
    useState<CommitmentSummary | null>(null);

  const walletAddress = wallet?.account.address;
  const progress = ((step + 1) / steps.length) * 100;

  const preview = useMemo(
    () => ({
      title: state.title,
      description: state.description,
      category: state.category,
      proofType: state.proofType,
      stakeLabel: `${state.stakeAmountSol} SOL`,
      totalDays: state.durationDays,
    }),
    [state]
  );

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const next = () => setStep((current) => Math.min(current + 1, steps.length - 1));
  const back = () => setStep((current) => Math.max(current - 1, 0));

  const submit = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/commitments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            title: state.title,
            description: state.description,
            category: state.category,
            proofType: state.proofType,
            stakeAmountSol: state.stakeAmountSol,
            durationDays: state.durationDays,
            visibility: state.visibility,
            slashDestination: state.slashDestination,
            timezone: state.timezone,
            notifyTime: state.notifyTime,
            worldIdVerified: state.worldIdVerified,
          }),
        });

        const data = (await response.json()) as {
          ok: boolean;
          commitment?: CommitmentSummary;
          error?: string;
        };

        if (!response.ok || !data.ok || !data.commitment) {
          throw new Error(data.error ?? "Unable to create commitment");
        }

        setCreatedCommitment(data.commitment);
        toast.success("Your oath is live.");
        router.push(data.commitment.publicUrl);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Creation failed");
      }
    });
  };

  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {steps.map((label, index) => (
            <Badge
              key={label}
              className={`rounded-full px-4 py-2 ${
                index === step
                  ? "bg-oath-gold/15 text-oath-gold hover:bg-oath-gold/20"
                  : "bg-oath-surface/70 text-oath-muted-text hover:bg-oath-surface"
              }`}
              variant="outline"
            >
              {index + 1}. {label}
            </Badge>
          ))}
        </div>

        <Progress value={progress} className="h-2" />

        <Card className="border-oath-border/70 bg-oath-surface/80">
          <CardHeader className="space-y-3">
            <Badge className="w-fit bg-oath-gold/10 text-oath-gold hover:bg-oath-gold/20">
              Step {step + 1}
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.03em]">
              {steps[step]}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {step === 0
                ? "Define the commitment and the proof type."
                : step === 1
                  ? "Set duration and daily proof cadence."
                  : step === 2
                    ? "Lock the stake and slash destination."
                    : step === 3
                      ? "Choose visibility and human verification."
                      : step === 4
                        ? "Tune the tone, timezone, and nudge schedule."
                        : "Review the oath before it becomes public."}
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {step === 0 && (
              <>
                <Field label="Goal" hint="What are you committing to?">
                  <Input
                    value={state.title}
                    onChange={(event) => update("title", event.target.value)}
                    className="border-oath-border bg-background/50"
                  />
                </Field>
                <Field label="Description" hint="Short public context">
                  <Textarea
                    value={state.description}
                    onChange={(event) => update("description", event.target.value)}
                    className="min-h-32 border-oath-border bg-background/50"
                  />
                </Field>
                <Field label="Category" hint="Used for feed and profile filtering">
                  <ChipGrid
                    options={categories}
                    value={state.category}
                    onChange={(value) => update("category", value)}
                  />
                </Field>
                <Field label="Proof type" hint="How you will prove it">
                  <ChipGrid
                    options={proofTypes}
                    value={state.proofType}
                    onChange={(value) => update("proofType", value)}
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <Field label="Duration" hint="How long the oath runs">
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {[7, 14, 21, 30, 60, 90].map((duration) => (
                      <Button
                        key={duration}
                        type="button"
                        variant={state.durationDays === duration ? "default" : "outline"}
                        className={
                          state.durationDays === duration
                            ? "bg-oath-gold text-black hover:bg-oath-gold/90"
                            : "border-oath-border bg-background/40"
                        }
                        onClick={() => update("durationDays", duration)}
                      >
                        {duration}d
                      </Button>
                    ))}
                  </div>
                </Field>
                <Field label="Custom duration" hint="Optional manual override">
                  <Input
                    type="number"
                    min={1}
                    value={state.durationDays}
                    onChange={(event) =>
                      update("durationDays", Number(event.target.value || 30))
                    }
                    className="border-oath-border bg-background/50"
                  />
                </Field>
                <Field label="Proof cadence" hint="Required proof days matches duration">
                  <div className="rounded-2xl border border-oath-border bg-background/40 p-4 text-sm text-muted-foreground">
                    {state.durationDays} days locked · {state.durationDays} proofs required
                  </div>
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Stake" hint="SOL only for MVP">
                  <div className="grid grid-cols-4 gap-2">
                    {[0.1, 0.5, 1, 2].map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant={state.stakeAmountSol === amount ? "default" : "outline"}
                        className={
                          state.stakeAmountSol === amount
                            ? "bg-oath-gold text-black hover:bg-oath-gold/90"
                            : "border-oath-border bg-background/40"
                        }
                        onClick={() => update("stakeAmountSol", amount)}
                      >
                        {amount} SOL
                      </Button>
                    ))}
                  </div>
                </Field>
                <Field label="Custom stake" hint="Any positive amount">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={state.stakeAmountSol}
                    onChange={(event) =>
                      update("stakeAmountSol", Number(event.target.value || 1))
                    }
                    className="border-oath-border bg-background/50"
                  />
                </Field>
                <Field label="Slash destination" hint="Where failure goes">
                  <ChipGrid
                    options={slashOptions}
                    value={state.slashDestination}
                    onChange={(value) => update("slashDestination", value)}
                  />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Visibility" hint="Public by default">
                  <ChipGrid
                    options={visibilityOptions}
                    value={state.visibility}
                    onChange={(value) => update("visibility", value)}
                  />
                </Field>
                <Field label="World ID" hint="Verified human badge for the public page">
                  <Button
                    type="button"
                    variant={state.worldIdVerified ? "default" : "outline"}
                    className={
                      state.worldIdVerified
                        ? "bg-oath-green text-black hover:bg-oath-green/90"
                        : "border-oath-border bg-background/40"
                    }
                    onClick={() => update("worldIdVerified", !state.worldIdVerified)}
                  >
                    {state.worldIdVerified ? "Verified" : "Verify human"}
                  </Button>
                </Field>
              </>
            )}

            {step === 4 && (
              <>
                <Field label="Coach tone" hint="How the nudges should feel">
                  <ChipGrid
                    options={toneOptions}
                    value={state.tone}
                    onChange={(value) => update("tone", value)}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Notify time" hint="HH:MM">
                    <Input
                      value={state.notifyTime}
                      onChange={(event) => update("notifyTime", event.target.value)}
                      className="border-oath-border bg-background/50"
                    />
                  </Field>
                  <Field label="Timezone" hint="IANA timezone">
                    <Input
                      value={state.timezone}
                      onChange={(event) => update("timezone", event.target.value)}
                      className="border-oath-border bg-background/50"
                    />
                  </Field>
                </div>
              </>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-oath-border bg-background/40 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                        Maker
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {walletAddress ?? "Connect a wallet to publish"}
                      </p>
                    </div>
                    <Badge className="bg-oath-gold/10 text-oath-gold hover:bg-oath-gold/20">
                      {state.visibility}
                    </Badge>
                  </div>
                  <Separator className="my-4 bg-oath-border" />
                  <p className="text-lg font-medium leading-7">{state.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {state.description}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Mini label="Stake" value={`${state.stakeAmountSol} SOL`} />
                  <Mini label="Duration" value={`${state.durationDays} days`} />
                  <Mini label="Proof" value={state.proofType} />
                  <Mini label="Tone" value={state.tone} />
                </div>

                {createdCommitment ? (
                  <div className="rounded-3xl border border-oath-green/30 bg-oath-green/10 p-5 text-sm text-oath-green">
                    Oath created. Redirecting to {createdCommitment.publicUrl}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={step === 0 || isPending}
            className="rounded-full border-oath-border bg-oath-surface/70"
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={next}
              className="rounded-full bg-oath-gold text-black hover:bg-oath-gold/90"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="rounded-full bg-oath-gold text-black hover:bg-oath-gold/90"
            >
              {isPending ? "Launching..." : "Deploy oath"}
            </Button>
          )}
        </div>
      </div>

      <Card className="h-fit border-oath-border/70 bg-oath-surface/80 lg:sticky lg:top-28">
        <CardHeader>
          <Badge className="w-fit bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
            Preview
          </Badge>
          <CardTitle className="text-2xl tracking-[-0.03em]">Public oath card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-3xl border border-oath-border bg-background/40 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              Goal
            </p>
            <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">{preview.title}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {preview.description}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Category" value={preview.category} />
            <Mini label="Proof" value={preview.proofType} />
            <Mini label="Stake" value={preview.stakeLabel} />
            <Mini label="Duration" value={`${preview.totalDays} days`} />
          </div>
          <div className="rounded-3xl border border-oath-border bg-background/40 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              Wallet
            </p>
            <p className="mt-2 break-all text-sm text-foreground">
              {walletAddress ?? "Connect wallet to use a real maker address"}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              Coach
            </p>
            <p className="mt-2 text-sm text-foreground">
              {state.tone} · {state.notifyTime} · {state.timezone}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-oath-muted-text">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-oath-border bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function ChipGrid<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          variant={option === value ? "default" : "outline"}
          className={
            option === value
              ? "bg-oath-gold text-black hover:bg-oath-gold/90"
              : "border-oath-border bg-background/40"
          }
          onClick={() => onChange(option)}
        >
          {option.replaceAll("_", " ")}
        </Button>
      ))}
    </div>
  );
}
