import { NextResponse } from "next/server";
import { getCommitmentBySlug } from "@/lib/oath-data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("walletAddress")?.trim() ?? undefined;
  const accessToken = url.searchParams.get("accessToken")?.trim() ?? undefined;

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  const commitment = await getCommitmentBySlug(slug, walletAddress, accessToken);

  if (!commitment) {
    return NextResponse.json({ ok: false, error: "Commitment not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    commitment,
  });
}
