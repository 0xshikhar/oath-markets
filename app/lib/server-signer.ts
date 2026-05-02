import { createKeyPairSignerFromPrivateKeyBytes, type TransactionSigner } from "@solana/kit";

function parsePrivateKeyBytes(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("OATH_AUTHORITY_PRIVATE_KEY is required");
  }

  const parsed = JSON.parse(trimmed) as number[] | string;
  if (typeof parsed === "string") {
    const asArray = parsed
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((part) => Number.isFinite(part));
    return Uint8Array.from(asArray);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("OATH_AUTHORITY_PRIVATE_KEY must be a JSON array of bytes");
  }

  return Uint8Array.from(parsed);
}

export async function getAuthoritySigner(): Promise<TransactionSigner> {
  const raw = process.env.OATH_AUTHORITY_PRIVATE_KEY;
  const privateKeyBytes = parsePrivateKeyBytes(raw ?? "");
  return createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);
}

