import { NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit/signing";
import { getWorldIdRequestConfig } from "@/lib/world-id";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = getWorldIdRequestConfig();

  if (!config) {
    return NextResponse.json(
      { ok: false, error: "World ID is not configured" },
      { status: 503 }
    );
  }

  const signature = signRequest({
    signingKeyHex: config.signingKeyHex,
    action: config.action,
  });

  return NextResponse.json({
    ok: true,
    appId: config.appId,
    action: config.action,
    environment: config.environment,
    rpContext: {
      rp_id: config.rpId,
      nonce: signature.nonce,
      created_at: signature.createdAt,
      expires_at: signature.expiresAt,
      signature: signature.sig,
    },
  });
}
