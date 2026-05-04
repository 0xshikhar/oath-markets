import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PublicPageShell } from "../components/public-page-shell";
import { FeedClient } from "../components/feed-client";

export default function FeedPage() {
  return (
    <PublicPageShell
      eyebrow="Feed"
      title="Your commitment activity stream."
      description="Follow the makers you care about, watch proofs land in real time, and react to the updates that matter."
      actions={
        <Button asChild variant="outline" className="rounded-[var(--radius)] border-oath-border bg-background/40">
          <Link href="/explore">Discover makers</Link>
        </Button>
      }
    >
      <FeedClient />
    </PublicPageShell>
  );
}
