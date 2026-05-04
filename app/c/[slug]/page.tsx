import { CommitmentSurfaceClient } from "../../components/commitment-surface-client";
import { PublicPageShell } from "../../components/public-page-shell";
import { getCommitmentBySlug } from "@/lib/oath-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type CommitmentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CommitmentPage({ params }: CommitmentPageProps) {
  const { slug } = await params;
  const commitment = await getCommitmentBySlug(slug);

  return (
    <PublicPageShell
      eyebrow="Commitment"
      title="Public commitment streak page."
      description="This is the viral surface: goal, stake, believers, proof feed, and coach responses all in one place."
      actions={
        <Button asChild variant="outline" className="rounded-[var(--radius)] border-oath-border bg-background/40">
          <Link href="/explore">Back to explore</Link>
        </Button>
      }
    >
      <CommitmentSurfaceClient commitment={commitment} />
    </PublicPageShell>
  );
}
