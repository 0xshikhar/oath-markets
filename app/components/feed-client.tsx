"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "../lib/wallet/context";
import { ProofReactionStrip } from "./proof-reaction-strip";
import { ArenaSidebar } from "./arena-sidebar";
import type { ActivityEvent, FeedResult } from "@/lib/social-data";
import { Fire, Trophy, Warning, Coins, MagnifyingGlass, Lightning } from "@phosphor-icons/react/dist/ssr";

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
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <FeedTimeline
        key={walletAddress}
        walletAddress={walletAddress}
        initialEvents={initialEvents}
        initialCursor={initialCursor}
      />
      <ArenaSidebar />
    </div>
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
  const [sort, setSort] = useState<"latest" | "trending">("latest");

  useEffect(() => {
    let cancelled = false;

    async function loadFeed() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/feed?walletAddress=${encodeURIComponent(walletAddress)}&limit=20&sort=${sort}`
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
  }, [walletAddress, sort]);

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
        )}&cursor=${encodeURIComponent(cursor ?? "")}&limit=20&sort=${sort}`
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
    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between border-b border-black/5 pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-black/30">Live Arena Feed</h2>
          <div className="flex bg-black/[0.03] p-1 rounded-lg">
            <button
              onClick={() => setSort("latest")}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${sort === "latest" ? "bg-white text-black shadow-sm" : "text-black/30 hover:text-black/60"}`}
            >
              Latest
            </button>
            <button
              onClick={() => setSort("trending")}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-md transition-all ${sort === "trending" ? "bg-white text-black shadow-sm" : "text-black/30 hover:text-black/60"}`}
            >
              Trending
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-oath-gold animate-pulse" />
          <span className="text-[10px] font-bold text-black uppercase tracking-widest">Real-time</span>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="space-y-6">
          {events.map((event) => <FeedEventCard key={event.id} event={event} />)}
        </div>
      ) : (
        <Card className="border-black/5 bg-white shadow-sm">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
              <MagnifyingGlass size={24} className="text-black/10" />
            </div>
            <p className="text-sm text-black/30 font-medium">
              {emptyMessage}
            </p>
          </CardContent>
        </Card>
      )}

      {cursor ? (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            className="rounded-xl border-black/5 bg-white text-xs font-bold uppercase tracking-widest text-black shadow-sm hover:bg-black/5"
            onClick={handleLoadMore}
          >
            Load more events
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function FeedEventCard({ event }: { event: ActivityEvent }) {
  const Icon = eventIcon(event);
  
  return (
    <Card className="group relative border-black/5 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-oath-gold">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-oath-gold opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="p-5 sm:p-7 pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvatarBubble
              name={event.actorName}
              avatarUrl={event.actorAvatarUrl}
              verified={event.actorVerified}
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                <span className="font-black text-black uppercase tracking-wider">{event.actorName}</span>
                <span className="text-black/20 font-medium">{event.actorHandle}</span>
                <span className="text-black/10">·</span>
                <span className="text-black/20 font-bold uppercase tracking-widest">{formatDate(event.createdAtIso)}</span>
              </div>
              <CardTitle className="text-lg sm:text-2xl font-black text-black tracking-tight leading-tight">
                {eventTitle(event)}
              </CardTitle>
            </div>
          </div>
          <div className="bg-black/5 p-2 rounded-lg border border-black/5">
            <Icon size={18} className="text-black/30" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 sm:p-7 pt-2 sm:pt-3 space-y-6">
        <div className="relative">
          {event.type === "NEW_OATH" ? (
            <EventBody
              badgeLabel="Market Open"
              badgeClassName="bg-oath-gold text-black border-oath-gold"
              title={event.title}
              description={event.description}
              footerLeft={`${event.totalDays} Days Commitment`}
              footerRight={event.stakeLabel}
            />
          ) : null}

          {event.type === "NEW_PROOF" ? (
            <div className="space-y-4">
              <EventBody
                badgeLabel={`Day ${event.dayNumber} Proof`}
                badgeClassName="bg-black text-white border-black"
                title={event.title}
                description={event.excerpt}
                footerLeft="Proof Verified On-chain"
                footerRight="Live Stats"
              />
              <div className="pt-2 border-t border-black/5">
                <ProofReactionStrip
                  proofId={event.proofId}
                  initialCounts={event.reactionCounts}
                />
              </div>
            </div>
          ) : null}

          {event.type === "BELIEVER" ? (
            <EventBody
              badgeLabel="Co-Stake"
              badgeClassName="bg-black/5 text-black border-black/10"
              title={`${event.actorName} believed in ${event.targetName}'s oath`}
              description={event.title}
              footerLeft={event.actorHandle}
              footerRight={`+ ${event.stakeLabel} Pool`}
            />
          ) : null}

          {event.type === "FOLLOW" ? (
            <EventBody
              badgeLabel="New Follower"
              badgeClassName="bg-oath-gold/10 text-oath-black border-oath-gold/20"
              title={`${event.actorName} started following ${event.targetName}`}
              description={`Connecting the social graph. Watchers increase the pressure.`}
              footerLeft={event.actorHandle}
              footerRight="Arena Graph"
            />
          ) : null}

          {event.type === "CHALLENGE" ? (
            <EventBody
              badgeLabel="New Challenge"
              badgeClassName="bg-red-500/10 text-red-500 border-red-500/20"
              title={`${event.actorName} challenged ${event.targetName}`}
              description={event.goal}
              footerLeft={`Stake: ${event.stakeLabel}`}
              footerRight="Acceptance Pending"
            />
          ) : null}

          {event.type === "RESOLVED" ? (
            <EventBody
              badgeLabel={event.statusLabel}
              badgeClassName={
                event.status === "COMPLETED"
                  ? "bg-oath-gold text-black border-oath-gold"
                  : "bg-red-500 text-white border-red-500"
              }
              title={`${event.actorName} ${event.status === "COMPLETED" ? "completed" : "failed"} their oath`}
              description={event.title}
              footerLeft="Market Resolved"
              footerRight={event.statusLabel}
            />
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button asChild className="h-10 px-6 bg-black text-white hover:bg-oath-gold hover:text-black transition-all rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
            <Link href={event.publicUrl}>Open Arena Oath</Link>
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
    <div className="space-y-4">
      <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${badgeClassName}`}>{badgeLabel}</Badge>
      <div className="space-y-2">
        <p className="text-lg font-bold text-black leading-tight">{title}</p>
        <p className="text-sm leading-6 text-black/40 line-clamp-3">{description}</p>
      </div>
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-black/20">
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
      <div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-black/5 text-sm font-black text-black shadow-inner">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {verified ? (
        <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-lg border border-black/5 bg-white text-[10px] text-oath-gold shadow-sm">
          ✓
        </span>
      ) : null}
    </div>
  );
}

function eventIcon(event: ActivityEvent) {
  if (event.type === "NEW_OATH") return Trophy;
  if (event.type === "NEW_PROOF") return Fire;
  if (event.type === "BELIEVER") return Coins;
  if (event.type === "FOLLOW") return Lightning;
  if (event.type === "CHALLENGE") return Warning;
  return event.status === "COMPLETED" ? Trophy : Warning;
}

function eventTitle(event: ActivityEvent) {
  if (event.type === "NEW_OATH") return "Opened a New Arena Market";
  if (event.type === "NEW_PROOF") return `Committed Day ${event.dayNumber} Proof`;
  if (event.type === "BELIEVER") return "A New Believer Has Entered";
  if (event.type === "FOLLOW") return "New Connection in the Arena";
  if (event.type === "CHALLENGE") return "A Gauntlet Has Been Thrown";
  return event.status === "COMPLETED" ? "Market Resolved: Success" : "Market Resolved: Failed";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
