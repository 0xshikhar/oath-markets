import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CreateWizard } from "../components/create-wizard";
import { PublicPageShell } from "../components/public-page-shell";

export default function CreatePage() {
  return (
    <PublicPageShell
      eyebrow="Create"
      title="Draft the oath before it goes public."
      description="The wizard walks a maker from goal text to stake, verification, and review. It is structured to match the production flow we are building: wallet connect, Prisma, World ID, and Anchor escrow."
      actions={
        <Button
          asChild
          variant="outline"
          className="rounded-full border-oath-border bg-background/40"
        >
          <Link href="/explore">See live oaths</Link>
        </Button>
      }
    >
      <CreateWizard />
    </PublicPageShell>
  );
}
