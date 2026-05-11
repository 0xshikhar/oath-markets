import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FeedClient } from "../components/feed-client";
import { SiteHeader } from "../components/site-header";
import { SiteFooter } from "../components/site-footer";
import { PublicPageShell } from "../components/public-page-shell";

export default function FeedPage() {
  return (
    <PublicPageShell
      eyebrow="Arena Dashboard"
      title={
        <>
          THE <span className="text-oath-gold italic">ARENA</span> <br />
          DASHBOARD.
        </>
      }
      description={
        <>
          The heartbeat of the commitment economy. <br />
          Watch the world stake, commit, and resolve in real-time.
        </>
      }
    >
      <FeedClient />
    </PublicPageShell>
  );
}
