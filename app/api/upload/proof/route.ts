import { NextResponse } from "next/server";
import { hasCloudinaryConfig } from "@/lib/cloudinary";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const CLOUDINARY_UPLOAD_ENDPOINT = (cloudName: string) =>
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

type CloudinaryUploadResponse = {
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
  bytes?: number;
  format?: string;
  error?: {
    message?: string;
  };
};

export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!hasCloudinaryConfig() || !cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { ok: false, error: "Cloudinary is not configured" },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "file is required" },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { ok: false, error: "Only image uploads are supported" },
      { status: 400 }
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Image must be 10MB or smaller" },
      { status: 413 }
    );
  }

  const authHeader = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const uploadBody = new FormData();
  uploadBody.append("file", file, file.name);
  uploadBody.append("folder", "oath/proofs");

  const uploadResponse = await fetch(CLOUDINARY_UPLOAD_ENDPOINT(cloudName), {
    method: "POST",
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
    body: uploadBody,
  });

  const uploadResult = (await uploadResponse.json()) as CloudinaryUploadResponse;

  if (!uploadResponse.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          uploadResult.error?.message ??
          `Cloudinary upload failed with status ${uploadResponse.status}`,
      },
      { status: uploadResponse.status }
    );
  }

  if (!uploadResult.secure_url) {
    return NextResponse.json(
      { ok: false, error: "Cloudinary upload did not return a secure URL" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    imageUrl: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    width: uploadResult.width,
    height: uploadResult.height,
    bytes: uploadResult.bytes,
    format: uploadResult.format,
  });
}
