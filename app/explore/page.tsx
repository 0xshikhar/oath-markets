import { ExploreClient } from "../components/explore-client";
import { PublicPageShell } from "../components/public-page-shell";
import { getExploreCommitments } from "@/lib/oath-data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function ExplorePage() {
  const commitments = await getExploreCommitments(9);

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
      <ExploreClient commitments={commitments} />
    </PublicPageShell>
  );
}
