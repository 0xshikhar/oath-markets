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
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function CommitmentPage({
  params,
  searchParams,
}: CommitmentPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const accessTokenValue = resolvedSearchParams.accessToken;
  const accessToken = Array.isArray(accessTokenValue)
    ? accessTokenValue[0]?.trim()
    : accessTokenValue?.trim();
  const commitment = await getCommitmentBySlug(slug, undefined, accessToken);

  if (commitment) {
    return (
      <PublicPageShell
        eyebrow={commitment.isPublic ? "Commitment" : "Private commitment"}
        title={
          commitment.isPublic
            ? "Public commitment streak page."
            : "Private commitment unlocked."
        }
        description={
          commitment.isPublic
            ? "This is the viral surface: goal, stake, believers, proof feed, and coach responses all in one place."
            : "This private oath is visible because the maker wallet connected or a private access link was used. The page stays out of the public feed, but invited viewers can still participate."
        }
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
        <CommitmentSurfaceClient
          commitment={commitment}
          slug={slug}
          accessToken={accessToken ?? null}
        />
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
      description="Connect the maker wallet or open a private access link to unlock this commitment, its proof feed, and its discussion thread."
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
      <CommitmentSurfaceClient commitment={null} slug={slug} accessToken={accessToken ?? null} />
    </PublicPageShell>
  );
}
