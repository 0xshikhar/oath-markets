import { NextResponse } from "next/server";
import { syncHeliusWebhookPayload } from "@/lib/helius-sync";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.HELIUS_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim() ||
    request.headers.get("x-helius-webhook-secret")?.trim() ||
    request.headers.get("x-webhook-secret")?.trim();

  return header === secret;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/webhooks/helius",
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const summary = await syncHeliusWebhookPayload(payload);

  return NextResponse.json({
    ok: true,
    ...summary,
  });
}
