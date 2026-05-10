import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/oath-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("walletAddress")?.trim() ?? undefined;

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  const summary = await getDashboardSummary(walletAddress);

  return NextResponse.json({
    ok: true,
    summary,
  });
}
