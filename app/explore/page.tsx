import { ExploreClient } from "../components/explore-client";
import { PublicPageShell } from "../components/public-page-shell";
import { getExploreCommitments } from "@/lib/oath-data";
import { getHotCommitments } from "@/lib/social-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ExplorePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readQueryValue(
  value: string | string[] | undefined,
  fallback = ""
) {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const query = (await searchParams) ?? {};
  const category = readQueryValue(query.category, "ALL");
  const sort = readQueryValue(query.sort, "believers");
  const search = readQueryValue(query.search, "");

  const commitments = await getExploreCommitments({
    category,
    sort: sort as "believers" | "recent" | "ending",
    search,
    limit: 9,
  });
  const allCommitments = await getExploreCommitments({ limit: 50 });
  const hotCommitments = await getHotCommitments(3);
  const categories = ["ALL", ...new Set(allCommitments.map((item) => item.category))];

  return (
    <PublicPageShell
      eyebrow="Explore"
      title="Browse public oaths and follow the ones worth watching."
      description="Every commitment is public by default: streak page, proof feed, believer pool, and resolution history. The more people watch, the harder it gets to disappear."
      actions={
        <Button
          asChild
          className="rounded-md bg-oath-gold text-black hover:bg-oath-gold/90"
        >
          <Link href="/create">Start an oath</Link>
        </Button>
      }
    >
      <ExploreClient
        key={`${category}:${sort}:${search}`}
        commitments={commitments}
        hotCommitments={hotCommitments}
        categories={categories}
        initialCategory={category}
        initialSort={sort as "believers" | "recent" | "ending"}
        initialSearch={search}
      />
    </PublicPageShell>
  );
}
