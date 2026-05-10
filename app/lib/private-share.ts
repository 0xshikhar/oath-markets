import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export type PrivateShareTokenPayload = {
  version: 1;
  scope: "commitment_private_access";
  slug: string;
  makerWalletAddress: string;
  issuedAt: number;
  expiresAt: number;
};

const DEFAULT_TTL_DAYS = 30;

function getPrivateShareSecret() {
  const rawSecret =
    process.env.OATH_PRIVATE_SHARE_SECRET?.trim() ||
    process.env.OATH_AUTHORITY_PRIVATE_KEY?.trim() ||
    process.env.PRIVATE_KEY?.trim() ||
    "oath-private-share-dev-secret";

  return rawSecret;
}

function encodeBase64Url(value: string | Uint8Array) {
  const buffer = typeof value === "string" ? Buffer.from(value, "utf8") : Buffer.from(value);
  return buffer.toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadJson: string) {
  return createHmac("sha256", getPrivateShareSecret())
    .update(payloadJson)
    .digest("base64url");
}

function isSignatureValid(payloadJson: string, signature: string) {
  const expectedSignature = Buffer.from(signPayload(payloadJson), "base64url");
  const providedSignature = Buffer.from(signature, "base64url");

  if (expectedSignature.length !== providedSignature.length) {
    return false;
  }

  return timingSafeEqual(expectedSignature, providedSignature);
}

export function createPrivateShareToken(input: {
  slug: string;
  makerWalletAddress: string;
  expiresInDays?: number;
  issuedAt?: number;
}) {
  const issuedAt = input.issuedAt ?? Date.now();
  const expiresAt =
    issuedAt + Math.max(1, input.expiresInDays ?? DEFAULT_TTL_DAYS) * 24 * 60 * 60 * 1000;
  const payload: PrivateShareTokenPayload = {
    version: 1,
    scope: "commitment_private_access",
    slug: input.slug,
    makerWalletAddress: input.makerWalletAddress,
    issuedAt,
    expiresAt,
  };
  const payloadJson = JSON.stringify(payload);
  const signature = signPayload(payloadJson);

  return `${encodeBase64Url(payloadJson)}.${signature}`;
}

export function verifyPrivateShareToken(
  token?: string | null,
  expected?: {
    slug?: string;
    makerWalletAddress?: string;
    at?: number;
  }
) {
  const trimmed = token?.trim();
  if (!trimmed) {
    return null;
  }

  const [encodedPayload, signature] = trimmed.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  let payloadJson = "";
  try {
    payloadJson = decodeBase64Url(encodedPayload);
  } catch {
    return null;
  }

  if (!isSignatureValid(payloadJson, signature)) {
    return null;
  }

  let payload: PrivateShareTokenPayload;
  try {
    payload = JSON.parse(payloadJson) as PrivateShareTokenPayload;
  } catch {
    return null;
  }

  if (payload.version !== 1 || payload.scope !== "commitment_private_access") {
    return null;
  }

  const now = expected?.at ?? Date.now();
  if (!Number.isFinite(payload.expiresAt) || payload.expiresAt <= now) {
    return null;
  }

  if (expected?.slug && payload.slug !== expected.slug) {
    return null;
  }

  if (expected?.makerWalletAddress && payload.makerWalletAddress !== expected.makerWalletAddress) {
    return null;
  }

  return payload;
}

export function buildPrivateShareUrl(origin: string, slug: string, token: string) {
  const url = new URL(`/c/${slug}`, origin);
  url.searchParams.set("accessToken", token);
  return url.toString();
}

