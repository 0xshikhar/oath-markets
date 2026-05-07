"use client";

import { getAddressDecoder, type Address } from "@solana/kit";
import type { WalletAccount } from "./wallet/types";

export const PREVIEW_WALLET_CONNECTOR = {
  id: "preview",
  name: "Preview session",
};

function hashPreviewSeed(seed: string) {
  const normalized = seed.trim().toLowerCase();
  const bytes = new Uint8Array(32);
  let state = 0x811c9dc5;

  for (let i = 0; i < normalized.length; i += 1) {
    state ^= normalized.charCodeAt(i);
    state = Math.imul(state, 0x01000193) >>> 0;
  }

  for (let i = 0; i < bytes.length; i += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    bytes[i] = state & 0xff;
    state = (state + i * 97 + normalized.length) >>> 0;
  }

  return bytes;
}

export function derivePreviewWalletAddress(email: string): Address {
  return getAddressDecoder().decode(hashPreviewSeed(email));
}

export function createPreviewWalletAccount(email: string): WalletAccount {
  const address = derivePreviewWalletAddress(email);
  const publicKey = hashPreviewSeed(email);

  return {
    address,
    publicKey,
    label: email.trim().toLowerCase(),
  };
}
