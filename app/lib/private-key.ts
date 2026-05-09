import { getBase58Encoder } from "@solana/kit";

function parseNumberArray(raw: string) {
  const parsed = JSON.parse(raw) as number[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("private key JSON must be a non-empty array of bytes");
  }

  return Uint8Array.from(parsed);
}

function parseCommaSeparatedBytes(raw: string) {
  const bytes = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part));

  if (!bytes.length) {
    throw new Error("private key string did not contain any byte values");
  }

  return Uint8Array.from(bytes);
}

export function parsePrivateKeyBytes(raw: string, label = "PRIVATE_KEY") {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error(`${label} is required`);
  }

  if (trimmed.startsWith("[")) {
    return parseNumberArray(trimmed);
  }

  if (trimmed.includes(",")) {
    return parseCommaSeparatedBytes(trimmed);
  }

  const decoded = getBase58Encoder().encode(trimmed);
  if (decoded.length !== 64) {
    throw new Error(
      `${label} must decode to 64 bytes, but decoded to ${decoded.length} bytes`
    );
  }

  return decoded;
}

export function getAuthorityPrivateKeyBytes() {
  const raw =
    process.env.OATH_AUTHORITY_PRIVATE_KEY?.trim() ||
    process.env.PRIVATE_KEY?.trim() ||
    "";

  const label = process.env.OATH_AUTHORITY_PRIVATE_KEY?.trim()
    ? "OATH_AUTHORITY_PRIVATE_KEY"
    : "PRIVATE_KEY";

  return parsePrivateKeyBytes(raw, label);
}
