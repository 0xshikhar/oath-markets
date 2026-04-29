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
  ACTIVE: "border-oath-gold/30 bg-oath-gold/10 text-oath-gold",
  COMPLETED: "border-oath-green/30 bg-oath-green/10 text-oath-green",
  FAILED: "border-oath-red/30 bg-oath-red/10 text-oath-red",
  ABANDONED: "border-border bg-muted text-muted-foreground",
};

export function CommitmentCard({ commitment, compact = false }: CommitmentCardProps) {
  return (
    <Card className="group border-oath-border/70 bg-card/90 shadow-[0_20px_80px_-60px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:-translate-y-1">
      <CardHeader className={compact ? "space-y-4 p-5" : "space-y-4 p-6"}>
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="border-oath-border bg-oath-surface/80 text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text"
          >
            {commitment.category}
          </Badge>
          <span
            className={`rounded-md border px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.22em] ${
              statusTone[commitment.status] ?? statusTone.ACTIVE
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
              <span className="rounded-full border border-oath-green/30 bg-oath-green/10 px-2 py-0.5 text-[0.65rem] font-medium text-oath-green">
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

      <CardContent className={compact ? "space-y-4 px-5 pb-5" : "space-y-4 px-6 pb-6"}>
        <Progress value={commitment.progressPercent} className="h-2 bg-oath-surface" />

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="Staked" value={commitment.stakeLabel} />
          <Metric label="Believers" value={commitment.believerCount.toString()} />
          <Metric label="Proofs" value={`${commitment.proofCount}/${commitment.totalDays}`} />
          <Metric label="Left" value={`${commitment.daysRemaining}d`} />
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-3 border-t border-oath-border/60 px-6 py-4">
        <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
          Day {commitment.proofCount} of {commitment.totalDays}
        </p>
        <Button asChild size="sm" className="rounded-md bg-oath-gold text-black hover:bg-oath-gold/90">
          <Link href={commitment.publicUrl}>View oath</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-oath-border bg-oath-surface/80 px-3 py-3">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}
