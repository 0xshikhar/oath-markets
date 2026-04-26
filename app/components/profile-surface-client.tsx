"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProfileView } from "@/lib/oath-data";
import { CommitmentCard } from "./commitment-card";

type ProfileSurfaceClientProps = {
  profile: ProfileView;
};

export function ProfileSurfaceClient({ profile }: ProfileSurfaceClientProps) {
  const active = profile.commitments.filter((commitment) => commitment.status === "ACTIVE");
  const completed = profile.commitments.filter(
    (commitment) => commitment.status === "COMPLETED"
  );
  const failed = profile.commitments.filter((commitment) => commitment.status === "FAILED");

  return (
    <section className="space-y-6">
      <Card className="border-oath-border/70 bg-oath-surface/80">
        <CardHeader className="space-y-4">
          <Badge className="w-fit bg-oath-gold/10 text-oath-gold hover:bg-oath-gold/20">
            Reputation profile
          </Badge>
          <CardTitle className="text-4xl tracking-[-0.04em] sm:text-5xl">
            {profile.displayName}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{profile.handle}</span>
            {profile.verified ? (
              <span className="rounded-full border border-oath-green/30 bg-oath-green/10 px-2 py-1 text-xs text-oath-green">
                Verified human
              </span>
            ) : null}
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">{profile.bio}</p>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Reputation" value={profile.reputationScore} />
          <Metric label="Completed" value={profile.completedCount.toString()} />
          <Metric label="Active" value={profile.activeCount.toString()} />
          <Metric label="Stake" value={profile.totalStakeLabel} />
        </CardContent>
      </Card>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-oath-surface/70">
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="grid gap-4 md:grid-cols-2">
          {active.length > 0 ? (
            active.map((commitment) => (
              <CommitmentCard key={commitment.slug} commitment={commitment} compact />
            ))
          ) : (
            <EmptyState text="No active oaths right now." />
          )}
        </TabsContent>
        <TabsContent value="completed" className="grid gap-4 md:grid-cols-2">
          {completed.length > 0 ? (
            completed.map((commitment) => (
              <CommitmentCard key={commitment.slug} commitment={commitment} compact />
            ))
          ) : (
            <EmptyState text="No completed oaths yet." />
          )}
        </TabsContent>
        <TabsContent value="failed" className="grid gap-4 md:grid-cols-2">
          {failed.length > 0 ? (
            failed.map((commitment) => (
              <CommitmentCard key={commitment.slug} commitment={commitment} compact />
            ))
          ) : (
            <EmptyState text="No failed oaths yet." />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-oath-border bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="border-oath-border/70 bg-oath-surface/80 md:col-span-2">
      <CardContent className="p-6 text-sm text-muted-foreground">{text}</CardContent>
    </Card>
  );
}
