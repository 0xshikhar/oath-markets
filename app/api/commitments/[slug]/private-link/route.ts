import { NextResponse } from "next/server";
import { getCommitmentAccessBySlug } from "@/lib/oath-data";
import { sameWalletAddress } from "@/lib/oath-access";
import { buildPrivateShareUrl, createPrivateShareToken } from "@/lib/private-share";

type PrivateLinkInput = {
  walletAddress?: string;
  expiresInDays?: number;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = (await request.json().catch(() => ({}))) as PrivateLinkInput;
  const walletAddress = body.walletAddress?.trim();

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  if (!walletAddress) {
    return NextResponse.json(
      { ok: false, error: "walletAddress is required" },
      { status: 400 }
    );
  }

  const commitment = await getCommitmentAccessBySlug(slug);
  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  if (commitment.isPublic) {
    return NextResponse.json(
      { ok: false, error: "Private links are only needed for private commitments" },
      { status: 400 }
    );
  }

  if (!sameWalletAddress(commitment.makerWalletAddress, walletAddress)) {
    return NextResponse.json(
      { ok: false, error: "Only the maker can generate a private link" },
      { status: 403 }
    );
  }

  const token = createPrivateShareToken({
    slug,
    makerWalletAddress: commitment.makerWalletAddress,
    expiresInDays: body.expiresInDays,
  });
  const shareUrl = buildPrivateShareUrl(new URL(request.url).origin, slug, token);
  const expiresAt = new Date(
    Date.now() + Math.max(1, body.expiresInDays ?? 30) * 24 * 60 * 60 * 1000
  );

  return NextResponse.json({
    ok: true,
    shareUrl,
    token,
    expiresAtIso: expiresAt.toISOString(),
  });
}

