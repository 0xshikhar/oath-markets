"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import type { CommitmentSummary } from "@/lib/oath-data";
import type { HotCommitment } from "@/lib/social-data";

type ExploreClientProps = {
  commitments: CommitmentSummary[];
  hotCommitments: HotCommitment[];
  categories: string[];
  initialCategory: string;
  initialSort: (typeof sortOptions)[number]["value"];
  initialSearch: string;
};

const sortOptions = [
  { value: "believers", label: "Most Believers" },
  { value: "recent", label: "Recently Created" },
  { value: "ending", label: "Ending Soon" },
] as const;

export function ExploreClient({
  commitments,
  hotCommitments,
  categories,
  initialCategory,
  initialSort,
  initialSearch,
}: ExploreClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>(
    initialSort
  );
  const [search, setSearch] = useState(initialSearch);

  const categoryOptions = useMemo(() => categories, [categories]);

  const pushFilters = (next: {
    category?: string;
    sort?: (typeof sortOptions)[number]["value"];
    search?: string;
  }) => {
    const params = new URLSearchParams();
    const nextCategory = next.category ?? category;
    const nextSort = next.sort ?? sort;
    const nextSearch = next.search ?? search;

    if (nextCategory && nextCategory !== "ALL") {
      params.set("category", nextCategory);
    }
    if (nextSort && nextSort !== "believers") {
      params.set("sort", nextSort);
    }
    if (nextSearch.trim().length > 0) {
      params.set("search", nextSearch.trim());
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const filtered = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return [...commitments]
      .filter((commitment) => {
        const matchesCategory =
          category === "ALL" || commitment.category === category;
        const matchesSearch =
          searchValue.length === 0 ||
          commitment.title.toLowerCase().includes(searchValue) ||
          commitment.description.toLowerCase().includes(searchValue) ||
          commitment.makerName.toLowerCase().includes(searchValue) ||
          commitment.makerHandle.toLowerCase().includes(searchValue);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === "ending") return a.daysRemaining - b.daysRemaining;
        if (sort === "recent") {
          return (
            new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime()
          );
        }
        return b.believerCount - a.believerCount;
      });
  }, [category, commitments, search, sort]);

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <Card className="border-oath-border/70 bg-oath-surface/80">
          <CardHeader className="space-y-6 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="w-fit rounded-md border border-oath-border bg-background/50 text-[0.68rem] uppercase tracking-[0.26em] text-oath-muted-text">
                  Explore
                </Badge>
                <div className="space-y-2">
                  <CardTitle className="text-3xl tracking-[-0.03em] sm:text-4xl">
                    Active oaths with live pressure.
                  </CardTitle>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                    Browse public commitment pages, compare social pressure, and
                    find the oaths worth watching.
                  </p>
                </div>
              </div>
              <Button asChild className="rounded-md bg-oath-gold text-black hover:bg-oath-gold/90">
                <Link href="/create">Start an oath</Link>
              </Button>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.4fr_220px]">
              <Input
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);
                  pushFilters({ search: value });
                }}
                placeholder="Search by goal, maker, or proof type"
                className="rounded-md border-oath-border bg-background/50"
              />
              <Select
                value={sort}
                onValueChange={(value) => {
                  const nextSort = value as (typeof sortOptions)[number]["value"];
                  setSort(nextSort);
                  pushFilters({ sort: nextSort });
                }}
              >
                <SelectTrigger className="rounded-md border-oath-border bg-background/50">
                  <SelectValue placeholder="Sort commitments" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((item) => {
                const active = item === category;
                return (
                  <Button
                    key={item}
                    type="button"
                    variant="outline"
                    className={
                      active
                        ? "rounded-md border-oath-gold bg-oath-gold/10 text-oath-gold hover:bg-oath-gold/15"
                        : "rounded-md border-oath-border bg-background/40 text-muted-foreground hover:bg-background/60 hover:text-foreground"
                    }
                    onClick={() => {
                      setCategory(item);
                      pushFilters({ category: item });
                    }}
                  >
                    {item}
                  </Button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <InfoStat label="Visible oaths" value={filtered.length.toString()} />
              <InfoStat
                label="Top category"
                value={categories.find((item) => item !== "ALL") ?? "ALL"}
              />
              <InfoStat
                label="Default sort"
                value={sortOptions.find((item) => item.value === sort)?.label ?? "-"}
              />
              <InfoStat label="Open stake" value="SOL only" />
            </div>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {filtered.length > 0 ? (
            filtered.map((commitment) => (
              <ExploreResultCard key={commitment.slug} commitment={commitment} />
            ))
          ) : (
            <Card className="border-oath-border/70 bg-oath-surface/80">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No oaths found. Be the first to create one.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="h-fit border-oath-border/70 bg-oath-surface/80 lg:sticky lg:top-28">
        <CardHeader className="space-y-3">
          <Badge className="w-fit rounded-md border border-oath-border bg-background/50 text-[0.68rem] uppercase tracking-[0.26em] text-oath-muted-text">
            Feed lens
          </Badge>
          <CardTitle className="text-2xl tracking-[-0.03em]">
            Why these commitments matter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
          <p>
            Public commitments work because the page is easy to scan in one
            glance. The goal, stake, believers, and proof cadence should be
            obvious without reading a long block of copy.
          </p>
          <div className="space-y-3 rounded-2xl border border-oath-border bg-background/30 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                Hot right now
              </p>
              <span className="text-xs text-oath-muted-text">24h reactions</span>
            </div>
            <div className="space-y-3">
              {hotCommitments.map((commitment) => (
                <Link
                  key={commitment.slug}
                  href={commitment.publicUrl}
                  className="block rounded-xl border border-oath-border bg-background/40 p-3 transition hover:border-oath-gold/30 hover:bg-oath-gold/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {commitment.title}
                      </p>
                      <p className="text-xs text-oath-muted-text">
                        {commitment.makerHandle} · {commitment.believerCount} believers
                      </p>
                    </div>
                    <span className="rounded-full border border-oath-border px-2 py-1 text-xs text-oath-gold">
                      {commitment.reactionCount24h}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-2 rounded-md border border-oath-border bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              Current filter
            </p>
            <p className="text-foreground">{category}</p>
          </div>
          <div className="space-y-2 rounded-md border border-oath-border bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              Sort
            </p>
            <p className="text-foreground">
              {sortOptions.find((option) => option.value === sort)?.label}
            </p>
          </div>
          <div className="space-y-2 rounded-md border border-oath-border bg-background/40 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              Audience
            </p>
            <p className="text-foreground">Makers, believers, and spectators</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function ExploreResultCard({ commitment }: { commitment: CommitmentSummary }) {
  return (
    <Card className="border-oath-border/70 bg-oath-surface/80 transition-colors duration-200 hover:border-oath-gold/30">
      <CardContent className="grid gap-4 p-5 sm:p-6 xl:grid-cols-[1fr_220px] xl:items-start">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-md border-oath-border bg-background/50 text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text"
              >
                {commitment.category}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-md border-oath-border bg-background/50 text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text"
              >
                {commitment.statusLabel}
              </Badge>
            </div>
            <span className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              {commitment.daysRemaining} days left
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{commitment.makerName}</span>
              <span className="text-oath-muted-text">{commitment.makerHandle}</span>
              {commitment.makerVerified ? (
                <span className="rounded-md border border-oath-green/30 bg-oath-green/10 px-2 py-0.5 text-[0.65rem] font-medium text-oath-green">
                  Verified
                </span>
              ) : null}
            </div>
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {commitment.title}
            </h3>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              {commitment.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Staked" value={commitment.stakeLabel} />
            <Metric label="Believers" value={commitment.believerCount.toString()} />
            <Metric label="Proofs" value={`${commitment.proofCount}/${commitment.totalDays}`} />
            <Metric label="Left" value={`${commitment.daysRemaining}d`} />
          </div>
        </div>

        <div className="space-y-4 rounded-md border border-oath-border bg-background/30 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-oath-muted-text">
              <span>Progress</span>
              <span>{commitment.progressPercent}%</span>
            </div>
            <Progress value={commitment.progressPercent} className="h-2" />
          </div>

          <div className="grid gap-2">
            <SmallStat label="Day" value={`${commitment.proofCount} / ${commitment.totalDays}`} />
            <SmallStat label="Believer pool" value={`${commitment.believerCount} supporters`} />
            <SmallStat label="Stake" value={commitment.stakeLabel} />
          </div>

          <Button asChild className="w-full rounded-md bg-oath-gold text-black hover:bg-oath-gold/90">
            <Link href={commitment.publicUrl}>View oath</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-oath-border bg-background/40 p-4">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-oath-muted-text">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-oath-border bg-oath-surface/80 px-3 py-3">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-oath-muted-text">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-oath-border bg-background/40 px-3 py-2">
      <p className="text-[0.6rem] uppercase tracking-[0.18em] text-oath-muted-text">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
