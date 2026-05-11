import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("walletAddress")?.trim();

  if (!walletAddress) {
    return NextResponse.json(
      { ok: false, error: "walletAddress is required" },
      { status: 400 }
    );
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Database is not configured" },
      { status: 503 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { walletAddress },
    select: {
      worldIdVerified: true,
      worldIdNullifier: true,
    },
  });

  return NextResponse.json({
    ok: true,
    verified: Boolean(user?.worldIdVerified),
    linked: Boolean(user?.worldIdNullifier),
  });
}
