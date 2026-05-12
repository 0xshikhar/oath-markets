import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CommitmentSummary } from "@/lib/oath-data";

type CommitmentCardProps = {
  commitment: CommitmentSummary;
  compact?: boolean;
};

const statusTone: Record<string, string> = {
  ACTIVE: "border-oath-gold/40 bg-oath-gold/10 text-foreground",
  COMPLETED: "border-oath-green/30 bg-oath-green/10 text-oath-green",
  FAILED: "border-oath-red/30 bg-oath-red/10 text-oath-red",
  ABANDONED: "border-border bg-muted text-muted-foreground",
};

export function CommitmentCard({ commitment, compact = false }: CommitmentCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-oath-border bg-card transition-transform duration-300 hover:-translate-y-0.5">
      <CardHeader className={compact ? "space-y-4 p-5" : "space-y-4 p-6"}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-oath-border bg-background text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text"
            >
              {commitment.category}
            </Badge>
            <Badge
              variant="outline"
              className="border-oath-border bg-background text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text"
            >
              {commitment.coachToneLabel}
            </Badge>
          </div>
          <span
            className={`rounded-[var(--radius)] border px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.22em] ${statusTone[commitment.status] ?? statusTone.ACTIVE
              }`}
          >
            {commitment.statusLabel}
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{commitment.makerName}</span>
            <span className="text-oath-muted-text">{commitment.makerHandle}</span>
            {commitment.makerVerified ? (
              <span className="rounded-[var(--radius)] border border-oath-green/30 bg-oath-green/10 px-2 py-0.5 text-[0.65rem] font-medium text-oath-green">
                Verified
              </span>
            ) : null}
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-foreground">
            {commitment.title}
          </h3>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {commitment.description}
          </p>
        </div>
      </CardHeader>

      <CardContent className={compact ? "flex flex-1 flex-col space-y-4 px-5 pb-5" : "flex flex-1 flex-col space-y-4 px-6 pb-6"}>
        <Progress value={commitment.progressPercent} className="h-2" />

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="Staked" value={commitment.stakeLabel} />
          <Metric label="Believers" value={commitment.believerCount.toString()} />
          <Metric label="Proofs" value={`${commitment.proofCount}/${commitment.totalDays}`} />
          <Metric label="Left" value={`${commitment.daysRemaining}d`} />
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex items-center justify-between gap-3 border-t border-oath-border/60 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
          Day {commitment.proofCount} of {commitment.totalDays}
        </p>
        <Button asChild size="sm" className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90">
          <Link href={commitment.publicUrl}>View oath</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-[var(--radius)] border border-oath-border bg-background px-3 py-3">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-2 break-words font-mono text-sm leading-5 text-foreground">
        {value}
      </p>
    </div>
  );
}
