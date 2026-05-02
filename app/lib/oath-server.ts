import { createClient } from "@solana/kit-client-rpc";
import { getAuthoritySigner } from "@/lib/server-signer";

export function getOathRpcUrl() {
  return (
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim() ||
    "https://api.devnet.solana.com"
  );
}

export async function createOathAuthorityClient() {
  const signer = await getAuthoritySigner();
  return createClient({
    url: getOathRpcUrl(),
    payer: signer,
  });
}

