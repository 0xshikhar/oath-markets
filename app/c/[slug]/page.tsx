import { CommitmentSurfaceClient } from "../../components/commitment-surface-client";
import { PublicPageShell } from "../../components/public-page-shell";
import { getCommitmentAccessBySlug, getCommitmentBySlug } from "@/lib/oath-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

type CommitmentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CommitmentPage({ params }: CommitmentPageProps) {
  const { slug } = await params;
  const commitment = await getCommitmentBySlug(slug);

  if (commitment) {
    return (
      <PublicPageShell
        eyebrow="Commitment"
        title="Public commitment streak page."
        description="This is the viral surface: goal, stake, believers, proof feed, and coach responses all in one place."
        actions={
          <Button
            asChild
            variant="outline"
            className="rounded-[var(--radius)] border-oath-border bg-background/40"
          >
            <Link href="/explore">Back to explore</Link>
          </Button>
        }
      >
        <CommitmentSurfaceClient commitment={commitment} slug={slug} />
      </PublicPageShell>
    );
  }

  const access = await getCommitmentAccessBySlug(slug);

  if (!access) {
    notFound();
  }

  return (
    <PublicPageShell
      eyebrow="Private commitment"
      title="This oath is private."
      description="Only the maker wallet can unlock this commitment, its proof feed, and its discussion thread."
      actions={
        <Button
          asChild
          variant="outline"
          className="rounded-[var(--radius)] border-oath-border bg-background/40"
        >
          <Link href="/explore">Back to explore</Link>
        </Button>
      }
    >
      <CommitmentSurfaceClient commitment={null} slug={slug} />
    </PublicPageShell>
  );
}
