"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const [followingCount, setFollowingCount] = useState(0);

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
          setFollowingCount(data.followingCount);
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
    : "The Arena is quiet. Be the first to start an oath or discover makers in the Explore tab.";

  const handleLoadMore = async () => {
    if (isLoading || !cursor) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/feed?walletAddress=${encodeURIComponent(
          walletAddress
        )}&cursor=${encodeURIComponent(cursor)}&limit=20&sort=${sort}`
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
          {followingCount > 0 && (
            <span className="text-[10px] font-bold text-black/40 bg-black/5 px-2 py-0.5 rounded-full">
              Following {followingCount} makers
            </span>
          )}
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
          {events.map((event) => (
            <FeedEventCard key={event.id} event={event} />
          ))}
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

      {cursor && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            className="rounded-xl border-black/5 bg-white text-xs font-bold uppercase tracking-widest text-black shadow-sm hover:bg-black/5"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more events"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FeedEventCard({ event }: { event: ActivityEvent }) {
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
            {event.type === "NEW_OATH" && <Trophy size={18} className="text-black/30" />}
            {event.type === "NEW_PROOF" && <Fire size={18} className="text-black/30" />}
            {event.type === "BELIEVER" && <Coins size={18} className="text-black/30" />}
            {event.type === "FOLLOW" && <Lightning size={18} className="text-black/30" />}
            {event.type === "CHALLENGE" && <Warning size={18} className="text-black/30" />}
            {event.type === "RESOLVED" && (
              event.status === "COMPLETED" 
                ? <Trophy size={18} className="text-black/30" /> 
                : <Warning size={18} className="text-black/30" />
            )}
            {!["NEW_OATH", "NEW_PROOF", "BELIEVER", "FOLLOW", "CHALLENGE", "RESOLVED"].includes(event.type) && (
              <Warning size={18} className="text-black/30" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-7 pt-0 space-y-6">
        <div className="space-y-4">
          {event.type === "NEW_OATH" && (
            <EventBody
              badgeLabel="Arena Market Created"
              badgeClassName="bg-oath-gold/10 text-oath-gold border-oath-gold/20"
              title={event.title}
              description={event.description}
              footerLeft={`Stake: ${event.stakeLabel}`}
              footerRight={`${event.totalDays} Day Commitment`}
            />
          )}

          {event.type === "NEW_PROOF" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-black/5 border-transparent text-[9px] font-black uppercase tracking-widest text-black/40">
                  Day {event.dayNumber} Progress
                </Badge>
              </div>
              <div className="p-4 bg-black/[0.02] border border-black/5 rounded-2xl">
                <p className="text-sm leading-relaxed text-black/60 italic">&quot;{event.excerpt}&quot;</p>
              </div>
              <div className="pt-2 border-t border-black/5">
                <ProofReactionStrip proofId={event.proofId} initialCounts={event.reactionCounts} />
              </div>
            </div>
          )}

          {event.type === "BELIEVER" && (
            <EventBody
              badgeLabel="New Believer"
              badgeClassName="bg-blue-500/10 text-blue-500 border-blue-500/20"
              title={`${event.actorName} backed ${event.targetName}`}
              description={event.title}
              footerLeft={`Stake: ${event.stakeLabel}`}
              footerRight="Believer Entry"
            />
          )}

          {event.type === "FOLLOW" && (
            <EventBody
              badgeLabel="New Connection"
              badgeClassName="bg-purple-500/10 text-purple-500 border-purple-500/20"
              title={`${event.actorName} started following ${event.targetName}`}
              description={`Connecting the social graph. Watchers increase the pressure.`}
              footerLeft={event.actorHandle}
              footerRight="Arena Graph"
            />
          )}

          {event.type === "CHALLENGE" && (
            <EventBody
              badgeLabel="New Challenge"
              badgeClassName="bg-red-500/10 text-red-500 border-red-500/20"
              title={`${event.actorName} challenged ${event.targetName}`}
              description={event.goal}
              footerLeft={`Stake: ${event.stakeLabel}`}
              footerRight="Acceptance Pending"
            />
          )}

          {event.type === "RESOLVED" && (
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
          )}
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
      <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${badgeClassName}`}>
        {badgeLabel}
      </Badge>
      <div className="space-y-2">
        <p className="text-lg font-bold text-black leading-tight">{title}</p>
        <p className="text-sm leading-6 text-black/40 line-clamp-3">{description}</p>
      </div>
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-black/20 pt-2">
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
          <Image src={avatarUrl} alt={name} width={56} height={56} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {verified && (
        <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-lg border border-black/5 bg-white text-[10px] text-oath-gold shadow-sm">
          ✓
        </span>
      )}
    </div>
  );
}

function eventTitle(event: ActivityEvent) {
  if (event.type === "NEW_OATH") return "Opened a New Arena Market";
  if (event.type === "NEW_PROOF") return `Committed Day ${event.dayNumber} Proof`;
  if (event.type === "BELIEVER") return "A New Believer Has Entered";
  if (event.type === "FOLLOW") return "New Connection in the Arena";
  if (event.type === "CHALLENGE") return "A Gauntlet Has Been Thrown";
  if (event.type === "RESOLVED") return event.status === "COMPLETED" ? "Market Resolved: Success" : "Market Resolved: Failed";
  return "Activity in the Arena";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
