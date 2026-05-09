import {
  createKeyPairSignerFromBytes,
  type TransactionSigner,
} from "@solana/kit";
import { getAuthorityPrivateKeyBytes } from "./private-key";

export async function getAuthoritySigner(): Promise<TransactionSigner> {
  return createKeyPairSignerFromBytes(getAuthorityPrivateKeyBytes());
}
