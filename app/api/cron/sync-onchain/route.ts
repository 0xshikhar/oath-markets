import { NextResponse } from "next/server";
import { reconcileCommitmentsFromChain } from "@/lib/helius-sync";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    request.headers.get("x-cron-secret")?.trim() ||
    request.headers.get("x-webhook-secret")?.trim();

  return header === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const summary = await reconcileCommitmentsFromChain();

  return NextResponse.json({
    ok: true,
    ...summary,
  });
}
