"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "../lib/wallet/context";
import { ProofReactionStrip } from "./proof-reaction-strip";
import type { ActivityEvent, FeedResult } from "@/lib/social-data";

type FeedClientProps = {
  initialEvents?: ActivityEvent[];
  initialCursor?: string | null;
};

type FeedApiResponse =
  | (FeedResult & { ok: true })
  | {
      ok: false;
      error?: string;
    };

export function FeedClient({
  initialEvents = [],
  initialCursor = null,
}: FeedClientProps) {
  const { wallet } = useWallet();
  const walletAddress = wallet?.account.address
    ? String(wallet.account.address)
    : undefined;

  if (!walletAddress) {
    return (
      <Card className="border-oath-border bg-card">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            Connect a wallet to unlock your personalized activity feed.
          </p>
          <Button asChild className="rounded-[var(--radius)] bg-oath-gold text-black hover:bg-oath-gold/90">
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <FeedTimeline
      key={walletAddress}
      walletAddress={walletAddress}
      initialEvents={initialEvents}
      initialCursor={initialCursor}
    />
  );
}

function FeedTimeline({
  walletAddress,
  initialEvents,
  initialCursor,
}: {
  walletAddress: string;
  initialEvents: ActivityEvent[];
  initialCursor: string | null;
}) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      try {
        const response = await fetch(
          `/api/feed?walletAddress=${encodeURIComponent(walletAddress)}&limit=20`
        );
        const data = (await response.json()) as FeedApiResponse;
        if (!response.ok) {
          throw new Error("Unable to load feed");
        }
        if (!data.ok) {
          throw new Error(data.error ?? "Unable to load feed");
        }

        if (!cancelled) {
          setEvents(data.events);
          setCursor(data.nextCursor);
          setHasLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setEvents([]);
          setCursor(null);
          setHasLoaded(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadFeed();

    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const emptyMessage = !hasLoaded || isLoading
    ? "Loading your feed..."
    : "Follow some makers to see their oaths here.";

  const handleLoadMore = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/feed?walletAddress=${encodeURIComponent(
          walletAddress
        )}&cursor=${encodeURIComponent(cursor ?? "")}&limit=20`
      );
      const data = (await response.json()) as FeedApiResponse;
      if (response.ok && data.ok) {
        setEvents((current) => [...current, ...data.events]);
        setCursor(data.nextCursor);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      {events.length > 0 ? (
        events.map((event) => <FeedEventCard key={event.id} event={event} />)
      ) : (
        <Card className="border-oath-border bg-card">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {emptyMessage}
          </CardContent>
        </Card>
      )}

      {cursor ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="rounded-[var(--radius)] border-oath-border bg-background/40"
            onClick={handleLoadMore}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function FeedEventCard({ event }: { event: ActivityEvent }) {
  return (
    <Card className="border-oath-border bg-card">
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <AvatarBubble
            name={event.actorName}
            avatarUrl={event.actorAvatarUrl}
            verified={event.actorVerified}
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{event.actorName}</span>
              <span className="text-oath-muted-text">{event.actorHandle}</span>
              <span className="text-oath-muted-text">·</span>
              <span className="text-oath-muted-text">{formatDate(event.createdAtIso)}</span>
            </div>
            <CardTitle className="text-xl tracking-[-0.03em]">{eventTitle(event)}</CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {event.type === "NEW_OATH" ? (
          <EventBody
            badgeLabel="New oath"
            badgeClassName="bg-oath-gold/10 text-oath-black"
            title={event.title}
            description={event.description}
            footerLeft={`${event.totalDays} days`}
            footerRight={event.stakeLabel}
          />
        ) : null}

        {event.type === "NEW_PROOF" ? (
          <div className="space-y-3">
            <EventBody
              badgeLabel={`Day ${event.dayNumber} proof`}
              badgeClassName="bg-oath-blue/10 text-oath-blue"
              title={event.title}
              description={event.excerpt}
              footerLeft="Proof posted"
              footerRight="Reactions"
            />
            <ProofReactionStrip
              proofId={event.proofId}
              initialCounts={event.reactionCounts}
            />
          </div>
        ) : null}

        {event.type === "BELIEVER" ? (
          <EventBody
            badgeLabel="New believer"
            badgeClassName="bg-oath-green/10 text-oath-green"
            title={`${event.actorName} believed in ${event.targetName}'s oath`}
            description={event.title}
            footerLeft={event.actorHandle}
            footerRight={event.stakeLabel}
          />
        ) : null}

        {event.type === "RESOLVED" ? (
          <EventBody
            badgeLabel={event.statusLabel}
            badgeClassName={
              event.status === "COMPLETED"
                ? "bg-oath-green/10 text-oath-green"
                : "bg-oath-red/10 text-oath-red"
            }
            title={`${event.actorName} ${event.status === "COMPLETED" ? "completed" : "failed"} their oath`}
            description={event.title}
            footerLeft={event.actorHandle}
            footerRight={event.statusLabel}
          />
        ) : null}

        <div className="flex justify-end">
          <Button asChild variant="ghost" className="rounded-[var(--radius)] text-oath-black hover:bg-oath-gold/10">
            <Link href={event.publicUrl}>Open oath</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EventBody({
  badgeLabel,
  badgeClassName,
  title,
  description,
  footerLeft,
  footerRight,
}: {
  badgeLabel: string;
  badgeClassName: string;
  title: string;
  description: string;
  footerLeft: string;
  footerRight: string;
}) {
  return (
    <div className="space-y-3">
      <Badge className={badgeClassName}>{badgeLabel}</Badge>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-oath-muted-text">
        <span>{footerLeft}</span>
        <span>{footerRight}</span>
      </div>
    </div>
  );
}

function AvatarBubble({
  name,
  avatarUrl,
  verified,
}: {
  name: string;
  avatarUrl: string | null;
  verified: boolean;
}) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="relative">
      <div className="flex size-12 items-center justify-center overflow-hidden rounded-full border border-oath-border bg-background/60 text-sm font-semibold">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {verified ? (
        <span className="absolute -right-1 -top-1 rounded-[var(--radius)] border border-oath-green/30 bg-oath-green/10 px-1.5 py-0.5 text-[0.55rem] font-semibold text-oath-green">
          ✓
        </span>
      ) : null}
    </div>
  );
}

function eventTitle(event: ActivityEvent) {
  if (event.type === "NEW_OATH") return "Made a new oath";
  if (event.type === "NEW_PROOF") return `Posted Day ${event.dayNumber} proof`;
  if (event.type === "BELIEVER") return "New believer joined";
  return event.status === "COMPLETED" ? "Completed their oath" : "Failed their oath";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
