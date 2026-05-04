import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CommitmentCard } from "./components/commitment-card";
import { GridBackground } from "./components/grid-background";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";
import { getFeaturedCommitments, getLandingStats } from "@/lib/oath-data";

export default async function Home() {
  const [stats, featuredCommitments] = await Promise.all([
    getLandingStats(),
    getFeaturedCommitments(3),
  ]);

  const spotlight = featuredCommitments[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GridBackground />
      <div className="relative z-10">
        <SiteHeader />

        <main className="mx-auto max-w-[1140px] px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <section className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge
                  variant="outline"
                  className="border-oath-border bg-oath-surface/80 px-4 py-2 text-[0.68rem] uppercase tracking-[0.28em] text-oath-muted-text"
                >
                  Frontier 2026 · Public stakes on Solana
                </Badge>

                <div className="max-w-4xl space-y-5">
                  <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                    Make a public oath.
                    <span className="block text-oath-black">Stake real SOL.</span>
                    Follow through in public.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    OATH turns private intentions into a visible commitment
                    economy. Create a goal, lock value in escrow, prove progress
                    daily, and let believers, skeptics, and your own future self
                    keep score.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-[var(--radius)] bg-oath-gold px-6 text-black hover:bg-oath-gold/90"
                >
                  <Link href="/create">Create an oath</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-[var(--radius)] border-oath-border bg-oath-surface/70 px-6 text-foreground hover:bg-oath-surface"
                >
                  <Link href="/explore">Browse live commitments</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Active oaths" value={stats.activeOaths.toString()} />
                <StatCard label="Total SOL staked" value={stats.totalStakeLabel} />
                <StatCard label="Believers" value={stats.believers.toString()} />
                <StatCard label="Completion rate" value={stats.completionRateLabel} />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <MiniPromise
                  title="Public by default"
                  description="Every oath has a shareable streak page, proof feed, and social pressure."
                />
                <MiniPromise
                  title="AI coach included"
                  description="Daily nudges are time-zone aware and built to keep momentum visible."
                />
                <MiniPromise
                  title="Believer economy"
                  description="Friends and fans can co-stake on your success and share the upside."
                />
              </div>
            </div>

            <div className="space-y-4">
              <Card className="overflow-hidden border-oath-border bg-oath-surface/85">
                <CardHeader className="space-y-4 border-b border-oath-border p-6">
                  <div className="flex items-center justify-between">
<Badge className="bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20">
                      Live
                    </Badge>
                    <span className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                      Preview
                    </span>
                  </div>
                  <CardTitle className="text-2xl leading-tight tracking-[-0.03em]">
                    {spotlight?.title}
                  </CardTitle>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {spotlight?.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-oath-muted-text">
                        Day {spotlight?.proofCount ?? 0} of {spotlight?.totalDays ?? 0}
                      </span>
                      <span className="font-mono text-oath-black">
                        {spotlight?.progressPercent ?? 0}%
                      </span>
                    </div>
                    <Progress value={spotlight?.progressPercent ?? 0} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MiniStat label="Maker" value={spotlight?.makerHandle ?? "-"} />
                    <MiniStat label="Stake" value={spotlight?.stakeLabel ?? "-"} />
                    <MiniStat
                      label="Believers"
                      value={spotlight?.believerCount.toString() ?? "-"}
                    />
                    <MiniStat label="Left" value={`${spotlight?.daysRemaining ?? 0} days`} />
                  </div>

                  <Separator className="bg-oath-border/70" />

                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.24em] text-oath-muted-text">
                      What the public page shows
                    </p>
                    <div className="grid gap-3">
                      <SignalRow label="Escrow" value="SOL locked on-chain until resolution" />
                      <SignalRow label="Proof feed" value="Daily text, photo, or link updates" />
                      <SignalRow label="Reputation" value="Portable score that compounds across oaths" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-oath-border bg-oath-surface/70">
                <CardContent className="grid gap-3 p-6 sm:grid-cols-3">
                  <Pill label="Public page" value="SEO + OG ready" />
                  <Pill label="Escrow" value="SOL locked" />
                  <Pill label="Coach" value="Daily nudges" />
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="mt-20 grid gap-4 md:grid-cols-3">
            <SectionCard
              index="01"
              title="Make it public"
              description="Write the oath, choose proof type, set stake, and publish a page anyone can share."
            />
            <SectionCard
              index="02"
              title="Prove it daily"
              description="Submit proof, post progress, and keep the streak alive with visible pressure."
            />
            <SectionCard
              index="03"
              title="Earn reputation"
              description="Complete the oath, resolve the escrow, and preserve a permanent on-chain reputation trail."
            />
          </section>

          <section className="mt-20 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-oath-border bg-oath-surface/80 text-[0.68rem] uppercase tracking-[0.26em] text-oath-muted-text"
                >
                  Featured commitments
                </Badge>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  The page where pressure becomes visible
                </h2>
              </div>
              <Button
                asChild
                variant="ghost"
                className="rounded-[var(--radius)] text-oath-black hover:bg-oath-gold/10 hover:text-oath-black"
              >
                <Link href="/explore">See all oaths</Link>
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {featuredCommitments.map((commitment) => (
                <CommitmentCard key={commitment.slug} commitment={commitment} />
              ))}
            </div>
          </section>

          <section className="mt-20 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-oath-border bg-oath-surface/80">
              <CardHeader>
<Badge className="w-fit bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20">
            How it works
          </Badge>
                <CardTitle className="text-3xl tracking-[-0.03em]">
                  Accountability that people can watch, fund, and verify
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  Private to-do lists fail because there is no social or financial
                  consequence for disappearing. OATH makes the cost of quitting
                  visible while making success something the entire network can
                  rally around.
                </p>
                <p>
                  The result is a product surface that is easy to share, easy to
                  understand, and easy to extend into reputation, coach, and
                  believer flows.
                </p>
              </CardContent>
            </Card>

            <Card className="border-oath-border bg-oath-surface/80">
              <CardHeader>
                <Badge className="w-fit bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
                  Launch path
                </Badge>
                <CardTitle className="text-3xl tracking-[-0.03em]">
                  What is wired next
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <LaunchRow
                  label="Prisma Postgres"
                  value="User, commitment, proof, belief, and coach tables"
                />
                <LaunchRow
                  label="Create wizard"
                  value="Wallet connect, World ID, stake, proof, and review"
                />
                <LaunchRow
                  label="Public routes"
                  value="/explore, /c/[slug], /u/[wallet], /dashboard"
                />
                <LaunchRow
                  label="On-chain sync"
                  value="Escrow vault, proof records, and reputation PDA"
                />
              </CardContent>
            </Card>
          </section>

          <section className="mt-20">
            <Card className="border-oath-border bg-oath-surface/80">
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <div className="space-y-3">
                  <Badge className="w-fit bg-oath-green/10 text-oath-green hover:bg-oath-green/20">
                    Believer CTA
                  </Badge>
                  <h2 className="text-3xl font-semibold tracking-[-0.03em]">
                    Your friends are making oaths. Believe in them, and the upside
                    is public too.
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                    OATH is built for spectators as much as makers. The public page
                    is the shared object, and the believer economy is what turns a
                    personal goal into a social market.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button
                  asChild
                  className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
                >
                  <Link href="/feed">Watch the feed</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-[var(--radius)] border-oath-border bg-background/40"
                >
                  <Link href="/create">Make your own oath</Link>
                </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-oath-border bg-oath-surface/70">
      <CardContent className="flex min-h-24 flex-col justify-between gap-2 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
          {label}
        </p>
        <p className="break-words text-2xl font-semibold leading-tight tracking-[-0.03em]">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-2 break-words font-mono text-sm leading-5 text-foreground">
        {value}
      </p>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-5 text-foreground">
        {value}
      </p>
    </div>
  );
}

function MiniPromise({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-oath-border bg-oath-surface/60 p-5">
      <p className="text-xs uppercase tracking-[0.24em] text-oath-black">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function SignalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function SectionCard({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-oath-border bg-oath-surface/80">
      <CardHeader className="space-y-4">
        <span className="text-xs uppercase tracking-[0.3em] text-oath-black">
          {index}
        </span>
        <CardTitle className="text-2xl tracking-[-0.03em]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-7 text-muted-foreground">
        {description}
      </CardContent>
    </Card>
  );
}

function LaunchRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-[var(--radius)] border border-oath-border bg-background/40 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-2 break-words text-sm leading-6 text-foreground">
        {value}
      </p>
    </div>
  );
}
