import { NextResponse } from "next/server";
import { getSocialPulse } from "@/lib/social-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("walletAddress")?.trim();

  if (!walletAddress) {
    return NextResponse.json(
      { ok: false, error: "walletAddress is required" },
      { status: 400 }
    );
  }

  try {
    const result = await getSocialPulse(walletAddress);
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("Failed to fetch social pulse:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
