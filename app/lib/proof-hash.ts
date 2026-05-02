type ProofHashInput = {
  commitmentSlug: string;
  dayNumber: number;
  textContent: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  publicNote?: string | null;
};

export async function buildProofContentHash(input: ProofHashInput) {
  const payload = JSON.stringify({
    commitmentSlug: input.commitmentSlug,
    dayNumber: input.dayNumber,
    textContent: input.textContent,
    imageUrl: input.imageUrl ?? null,
    linkUrl: input.linkUrl ?? null,
    publicNote: input.publicNote ?? null,
  });

  const bytes = new TextEncoder().encode(payload);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

