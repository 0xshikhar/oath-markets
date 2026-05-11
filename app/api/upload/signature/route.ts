import { NextResponse } from "next/server";
import { hasCloudinaryConfig } from "@/lib/cloudinary";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST() {
  console.log("[API /api/upload/signature] Request received");
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  console.log("[API /api/upload/signature] Config check:", {
    hasConfig: hasCloudinaryConfig(),
    cloudName: cloudName ? "set" : "missing",
    apiKey: apiKey ? "set" : "missing",
    apiSecret: apiSecret ? "set" : "missing",
  });

  if (!hasCloudinaryConfig() || !cloudName || !apiKey || !apiSecret) {
    console.error("[API /api/upload/signature] Missing config!");
    return NextResponse.json(
      { ok: false, error: "Cloudinary is not configured" },
      { status: 500 }
    );
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = "oath/proofs";
  
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

  console.log("[API /api/upload/signature] Returning signature:", {
    cloudName,
    folder,
    timestamp,
    signature: signature.substring(0, 20) + "...",
  });

  return NextResponse.json({
    ok: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
  });
}
