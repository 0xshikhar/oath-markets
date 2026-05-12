"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MagnifyingGlass,
  Funnel,
  ArrowClockwise,
  Fire,
  Warning,
  Lightning,
  Clock
} from "@phosphor-icons/react/dist/ssr";
import type { CommitmentSummary } from "@/lib/oath-data";
import { CommitmentCard } from "./commitment-card";
import { ArenaSidebar } from "./arena-sidebar";
import { cn } from "@/lib/utils";

type ExploreClientProps = {
  commitments: CommitmentSummary[];
  categories: string[];
  initialCategory: string;
  initialSort: string;
  initialSearch: string;
};

const sortOptions = [
  { value: "believers", label: "Most Believers", icon: <Fire size={14} /> },
  { value: "recent", label: "Recently Created", icon: <ArrowClockwise size={14} /> },
  { value: "at-risk", label: "At Risk", icon: <Warning size={14} className="text-red-500" /> },
  { value: "streak", label: "Perfect Streak", icon: <Lightning size={14} className="text-oath-gold" /> },
  { value: "ending", label: "Ending Soon", icon: <Clock size={14} /> },
] as const;

import { ActivityTicker } from "./activity-ticker";

export function ExploreClient({
  commitments,
  categories,
  initialCategory,
  initialSort,
  initialSearch,
}: ExploreClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [search, setSearch] = useState(initialSearch);

  const pushFilters = (next: {
    category?: string;
    sort?: string;
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
        if (sort === "at-risk") {
          if (a.isAtRisk && !b.isAtRisk) return -1;
          if (!a.isAtRisk && b.isAtRisk) return 1;
          return b.believerCount - a.believerCount;
        }
        if (sort === "streak") {
          return b.progressPercent - a.progressPercent;
        }
        if (sort === "recent") {
          return (
            new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime()
          );
        }
        return b.believerCount - a.believerCount;
      });
  }, [category, commitments, search, sort]);

  return (
    <div className="space-y-8">
      <ActivityTicker />
      <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 space-y-8 w-full">
        {/* Arena Controls */}
        <div className="bg-white border border-black/5 rounded-[2rem] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative flex-1 group">
              <MagnifyingGlass
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-oath-gold transition-colors"
              />
              <Input
                value={search}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearch(value);
                  pushFilters({ search: value });
                }}
                placeholder="Search the arena..."
                className="pl-11 h-12 bg-black/[0.02] border-black/5 rounded-xl focus:ring-oath-gold/20 focus:border-oath-gold transition-all text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-black/[0.02] border border-black/5 rounded-xl">
                <Funnel size={14} className="text-black/30" />
                <Select
                  value={sort}
                  onValueChange={(value) => {
                    setSort(value);
                    pushFilters({ sort: value });
                  }}
                >
                  <SelectTrigger className="border-none bg-transparent h-auto p-0 focus:ring-0 w-auto min-w-[180px] text-[10px] font-black uppercase tracking-[0.15em] text-black/60">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-black/5">
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs font-bold uppercase tracking-wider py-3">
                        <div className="flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((item) => {
              const active = item === category;
              return (
                <button
                  key={item}
                  onClick={() => {
                    setCategory(item);
                    pushFilters({ category: item });
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-200 border",
                    active
                      ? "bg-black text-white border-black shadow-lg"
                      : "bg-black/[0.02] text-black/40 border-black/5 hover:border-black/20 hover:text-black"
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.length > 0 ? (
            filtered.map((commitment) => (
              <CommitmentCard key={commitment.slug} commitment={commitment} />
            ))
          ) : (
            <div className="col-span-full py-20 bg-white border border-black/5 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4">
              <div className="size-16 rounded-2xl bg-black/5 flex items-center justify-center">
                <MagnifyingGlass size={32} className="text-black/10" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-black">No Oaths Found</p>
                <p className="text-xs text-black/40 font-medium mt-1">Try adjusting your filters or search query.</p>
              </div>
              <Button asChild className="bg-oath-gold text-black hover:bg-black hover:text-white rounded-xl h-12 px-8 font-black text-[10px] uppercase tracking-widest transition-all">
                <Link href="/create">Start New Oath</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <ArenaSidebar />
      </div>
    </div>
  );
}
