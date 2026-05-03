import { NextResponse } from "next/server";
import { getFeedEvents } from "@/lib/social-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("walletAddress")?.trim();
  const cursor = url.searchParams.get("cursor")?.trim() ?? null;
  const limit = Number(url.searchParams.get("limit") ?? "20");

  if (!walletAddress) {
    return NextResponse.json(
      { ok: false, error: "walletAddress is required" },
      { status: 400 }
    );
  }

  const result = await getFeedEvents(walletAddress, {
    limit: Number.isFinite(limit) ? limit : 20,
    cursor,
  });

  return NextResponse.json({
    ok: true,
    ...result,
  });
}
