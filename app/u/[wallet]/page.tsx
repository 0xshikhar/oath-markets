import { ProfileSurfaceClient } from "../../components/profile-surface-client";
import { PublicPageShell } from "../../components/public-page-shell";
import { getProfileByWallet } from "@/lib/oath-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type ProfilePageProps = {
  params: {
    wallet: string;
  };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const profile = await getProfileByWallet(params.wallet);

  return (
    <PublicPageShell
      eyebrow="Reputation"
      title="Public reputation profile."
      description="The profile page exposes oath score, status history, and commitment breakdowns for any wallet or handle."
      actions={
        <Button asChild variant="outline" className="rounded-full border-oath-border bg-background/40">
          <Link href="/explore">Browse commitments</Link>
        </Button>
      }
    >
      <ProfileSurfaceClient profile={profile} />
    </PublicPageShell>
  );
}
