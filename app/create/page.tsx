import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateWizard } from "../components/create-wizard";
import { PublicPageShell } from "../components/public-page-shell";

export default function CreatePage() {
  return (
    <PublicPageShell
      eyebrow="Create"
      title="Draft the Oath"
      description="Commit to your next milestone. Stake SOL, choose your coach, and establish your on-chain reputation. Every oath is a choice-publicly witnessed or privately enforced."
      actions={
        <Button
          asChild
          variant="outline"
          className="rounded-[var(--radius)] border-oath-border bg-background/40"
        >
          <Link href="/explore">See live oaths</Link>
        </Button>
      }
    >
      <CreateWizard />
    </PublicPageShell>
  );
}
