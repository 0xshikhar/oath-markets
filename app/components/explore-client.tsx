"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { CommitmentCard } from "./commitment-card";
import type { CommitmentSummary } from "@/lib/oath-data";

type ExploreClientProps = {
  commitments: CommitmentSummary[];
};

const sortOptions = [
  { value: "believers", label: "Most Believers" },
  { value: "recent", label: "Recently Created" },
  { value: "ending", label: "Ending Soon" },
] as const;

export function ExploreClient({ commitments }: ExploreClientProps) {
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("believers");
  const [search, setSearch] = useState("");

  const categories = useMemo(
    () => ["ALL", ...new Set(commitments.map((commitment) => commitment.category))],
    [commitments]
  );

  const filtered = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return [...commitments]
      .filter((commitment) => {
        const matchesCategory =
          category === "ALL" || commitment.category === category;
        const matchesSearch =
          searchValue.length === 0 ||
          commitment.title.toLowerCase().includes(searchValue) ||
          commitment.description.toLowerCase().includes(searchValue);
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
    <section className="space-y-6">
      <Card className="border-oath-border/70 bg-oath-surface/80">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge className="bg-oath-gold/10 text-oath-gold hover:bg-oath-gold/20">
                Explore
              </Badge>
              <CardTitle className="mt-3 text-3xl tracking-[-0.03em]">
                Active oaths with live pressure.
              </CardTitle>
            </div>
            <Button asChild className="rounded-full bg-oath-gold text-black hover:bg-oath-gold/90">
              <Link href="/create">Start an oath</Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by goal text"
              className="border-oath-border bg-background/50"
            />
            <Select value={sort} onValueChange={(value) => setSort(value as typeof sort)}>
              <SelectTrigger className="border-oath-border bg-background/50">
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
            {categories.map((item) => (
              <Button
                key={item}
                type="button"
                variant={item === category ? "default" : "outline"}
                className={
                  item === category
                    ? "bg-oath-gold text-black hover:bg-oath-gold/90"
                    : "border-oath-border bg-background/40"
                }
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((commitment) => (
            <CommitmentCard key={commitment.slug} commitment={commitment} compact />
          ))}
          {filtered.length === 0 ? (
            <Card className="border-oath-border/70 bg-oath-surface/80 md:col-span-2 xl:col-span-3">
              <CardContent className="p-6 text-sm text-muted-foreground">
                No oaths found. Be the first to create one.
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="h-fit border-oath-border/70 bg-oath-surface/80 lg:sticky lg:top-28">
          <CardHeader>
            <Badge className="w-fit bg-oath-blue/10 text-oath-blue hover:bg-oath-blue/20">
              Feed lens
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.03em]">
              Why these commitments matter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Public commitments work because the page is easy to read in one glance.
              The stake, the streak, and the believer pool all sit in the same field of view.
            </p>
            <div className="rounded-2xl border border-oath-border bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                Current filter
              </p>
              <p className="mt-2 text-foreground">{category}</p>
            </div>
            <div className="rounded-2xl border border-oath-border bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-oath-muted-text">
                Sort
              </p>
              <p className="mt-2 text-foreground">
                {sortOptions.find((option) => option.value === sort)?.label}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
