import { FeedClient } from "../components/feed-client";
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
