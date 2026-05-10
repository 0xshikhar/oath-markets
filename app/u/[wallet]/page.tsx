import { ProfileSurfaceClient } from "../../components/profile-surface-client";
import { PublicPageShell } from "../../components/public-page-shell";
import { getProfileByWallet } from "@/lib/oath-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

type ProfilePageProps = {
  params: Promise<{
    wallet: string;
  }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { wallet } = await params;
  const profile = await getProfileByWallet(wallet);

  if (!profile) {
    notFound();
  }

  return (
    <PublicPageShell
      eyebrow="Reputation"
      title="Public reputation profile."
      description="The profile page exposes oath score, status history, and commitment breakdowns for any wallet or handle."
      actions={
        <Button asChild variant="outline" className="rounded-[var(--radius)] border-oath-border bg-background/40">
          <Link href="/explore">Browse commitments</Link>
        </Button>
      }
    >
      <ProfileSurfaceClient profile={profile} />
    </PublicPageShell>
  );
}
