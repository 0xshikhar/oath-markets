import { DashboardClient } from "../components/dashboard-client";
import { PublicPageShell } from "../components/public-page-shell";
import { getDashboardSummary } from "@/lib/oath-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <PublicPageShell
      eyebrow="Dashboard"
      title="Your commitment command center."
      description="Track active commitments, keep proof submissions visible, and route the next coach message to the right time zone."
      actions={
        <Button
          asChild
          className="rounded-md bg-oath-gold text-black hover:bg-oath-gold/90"
        >
          <Link href="/create">Create oath</Link>
        </Button>
      }
    >
      <DashboardClient summary={summary} />
    </PublicPageShell>
  );
}
