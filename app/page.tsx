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
import { getFeaturedCommitments } from "@/lib/oath-data";

export default async function Home() {
  const featuredCommitments = await getFeaturedCommitments(3);

  const spotlight = featuredCommitments[0];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <GridBackground />
      <div className="relative z-10">
        <SiteHeader />

        <main className="mx-auto max-w-[1140px] px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <section className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge
                  variant="outline"
                  className="border-oath-border bg-oath-surface/80 px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.22em] text-oath-muted-text"
                >
                  ◆ Built on Solana · Frontier 2026
                </Badge>

                <div className="max-w-4xl space-y-5">
                  <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                    Your word, on-chain.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    Set a goal. Stake SOL. Submit daily proof.
                    Believers co-stake on your success — and the blockchain
                    keeps score forever.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-lg bg-oath-black px-6 text-background hover:bg-oath-black/80"
                >
                  <Link href="/create">Make Your First Oath</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-lg border-oath-border bg-transparent px-6 text-foreground hover:bg-oath-surface"
                >
                  <Link href="/#how-it-works">Watch How It Works →</Link>
                </Button>
              </div>

              {/* Pill badges row - replacing zero-state stats */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-oath-border bg-oath-surface/60 px-3 py-1">
                  Fully on-chain
                </span>
                <span className="text-oath-muted-text">·</span>
                <span className="rounded-full border border-oath-border bg-oath-surface/60 px-3 py-1">
                  Anchor escrow
                </span>
                <span className="text-oath-muted-text">·</span>
                <span className="rounded-full border border-oath-border bg-oath-surface/60 px-3 py-1">
                  Reputation on-chain
                </span>
                <span className="text-oath-muted-text">·</span>
                <span className="rounded-full border border-oath-border bg-oath-surface/60 px-3 py-1">
                  AI coach included
                </span>
              </div>

              {/* Inline feature rows */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <span className="mt-1 text-oath-black">↳</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Public by default</p>
                    <p className="text-sm text-muted-foreground">Your oath gets a shareable page the moment you create it.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 text-oath-black">↳</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Believers co-stake</p>
                    <p className="text-sm text-muted-foreground">Friends and fans back you with SOL and share the upside.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="mt-1 text-oath-black">↳</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">Reputation compounds</p>
                    <p className="text-sm text-muted-foreground">Every completed oath adds to your permanent on-chain score.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right Panel - Live Oath Preview Card */}
            <div className="space-y-4">
              <Card className="overflow-hidden border-oath-border/60 bg-oath-surface/85 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                <CardHeader className="space-y-4 border-b border-oath-border/60 p-6">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20">
                      LIVE EXAMPLE OATH
                    </Badge>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-oath-muted-text">
                      Preview
                    </span>
                  </div>
                  <CardTitle className="text-xl leading-tight tracking-[-0.03em]">
                    "Ship one public build note every day for 30 days"
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-5 p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-oath-muted-text">
                        Day 3 of 30
                      </span>
                      <span className="font-mono text-oath-black">
                        10%
                      </span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-oath-border bg-background/40 p-3">
                      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">MAKER</p>
                      <p className="mt-1 font-mono text-sm text-foreground">@shikhar.sol</p>
                    </div>
                    <div className="rounded-lg border border-oath-border bg-background/40 p-3">
                      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">STAKE</p>
                      <p className="mt-1 font-mono text-sm text-foreground">0.10 SOL</p>
                    </div>
                    <div className="rounded-lg border border-oath-border bg-background/40 p-3">
                      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">BELIEVERS</p>
                      <p className="mt-1 font-mono text-sm text-foreground">2</p>
                    </div>
                    <div className="rounded-lg border border-oath-border bg-background/40 p-3">
                      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">DAYS LEFT</p>
                      <p className="mt-1 font-mono text-sm text-foreground">27</p>
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    className="w rounded-[var(--radius)] text-oath-muted-text hover:bg-oath-gold/10 hover:text-oath-black"
                  >
                    <Link href="/explore">View Public Page →</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="mt-24 scroll-mt-24">
            <div className="space-y-8">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-oath-border bg-oath-surface/80 text-[0.68rem] uppercase tracking-[0.26em] text-oath-muted-text"
                >
                  HOW IT WORKS
                </Badge>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Four steps. Fully on-chain.
                </h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <HowItWorksStep
                  index="01"
                  title="Create Your Oath"
                  description="Name your goal. Set a deadline. Choose your stake amount. Your oath page goes live the moment you connect your wallet."
                />
                <HowItWorksStep
                  index="02"
                  title="Lock Your Stake"
                  description="SOL goes into an Anchor escrow vault on Solana. It stays locked until your deadline — win or lose."
                />
                <HowItWorksStep
                  index="03"
                  title="Prove It Daily"
                  description="Submit a text update, photo, or link every day. Your proof feed is public and timestamped on-chain."
                />
                <HowItWorksStep
                  index="04"
                  title="Earn Your Reputation"
                  description="Complete the oath → get 95% of your stake back + faith-fee yield. Fail → stake burns. Your Oath Score updates either way."
                />
              </div>
            </div>
          </section>

          {/* Believer Economy Section */}
          <section className="mt-24">
            <Card className="border-oath-border bg-oath-surface/80">
              <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:p-10">
                <div className="space-y-4">
                  <Badge className="w-fit bg-oath-gold/10 text-oath-black hover:bg-oath-gold/20">
                    THE BELIEVER ECONOMY
                  </Badge>
                  <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                    Back someone you believe in.
                    <span className="block">Earn when they follow through.</span>
                  </h2>
                  <p className="max-w-xl text-base leading-7 text-muted-foreground">
                    Every public oath accepts co-stakers. Believers put up SOL,
                    principal-protected, and earn a share of the faith fee
                    when the maker completes. Your money comes back either way.
                    Your yield depends on their follow-through.
                  </p>
                  <Button
                    asChild
                    className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90"
                  >
                    <Link href="/explore">Explore oaths to back →</Link>
                  </Button>
                </div>

                <div className="grid gap-4">
                  <BelieverFeature
                    title="Principal Protected"
                    description="Your SOL returns regardless of outcome."
                  />
                  <BelieverFeature
                    title="Faith Fee Yield"
                    description="Earn a portion of the completion pool."
                  />
                  <BelieverFeature
                    title="Reputation Stake"
                    description="Every belief you cast becomes part of your on-chain history too."
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Featured Commitments Section */}
          <section className="mt-24 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <Badge
                  variant="outline"
                  className="border-oath-border bg-oath-surface/80 text-[0.68rem] uppercase tracking-[0.26em] text-oath-muted-text"
                >
                  FEATURED COMMITMENTS
                </Badge>
                <h2 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  The page where pressure becomes visible.
                </h2>
                <p className="max-w-2xl text-base text-muted-foreground">
                  Every oath is public. Every proof is timestamped. Every completion builds reputation.
                </p>
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
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

function HowItWorksStep({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-oath-border bg-oath-surface/60 p-5">
      <span className="text-2xl font-bold tracking-[-0.03em] text-oath-black">{index}</span>
      <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-foreground">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function BelieverFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-oath-border bg-background/40 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}