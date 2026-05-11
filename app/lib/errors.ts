import {
  isSolanaError,
  SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM,
} from "@solana/kit";
import {
  getVaultErrorMessage,
  VAULT_ERROR__VAULT_ALREADY_EXISTS,
  VAULT_ERROR__INVALID_AMOUNT,
  type VaultError,
} from "./generated/vault";
import {
  getOathErrorMessage,
  OATH_ERROR__ALREADY_SETTLED,
  OATH_ERROR__ARITHMETIC_OVERFLOW,
  OATH_ERROR__COMMITMENT_NOT_ACTIVE,
  OATH_ERROR__COMMITMENT_NOT_RESOLVABLE_YET,
  OATH_ERROR__COMMITMENT_NOT_STARTED,
  OATH_ERROR__INSUFFICIENT_VAULT_BALANCE,
  OATH_ERROR__INVALID_BELIEVER_POOL,
  OATH_ERROR__INVALID_PROOF_THRESHOLD,
  OATH_ERROR__INVALID_STAKE,
  OATH_ERROR__INVALID_TIME_RANGE,
  OATH_ERROR__PROOF_DAY_OUT_OF_RANGE,
  OATH_ERROR__UNAUTHORIZED_BELIEVER,
  OATH_ERROR__UNAUTHORIZED_MAKER,
  OATH_ERROR__UNAUTHORIZED_RESOLVER,
  type OathError,
} from "./generated/oath/errors/oath";
import { getOathProgramMissingErrorMessage } from "./oath-program";

const VAULT_ERROR_CODES: Record<number, VaultError> = {
  [VAULT_ERROR__VAULT_ALREADY_EXISTS]: VAULT_ERROR__VAULT_ALREADY_EXISTS,
  [VAULT_ERROR__INVALID_AMOUNT]: VAULT_ERROR__INVALID_AMOUNT,
};

const OATH_ERROR_CODES: Record<number, OathError> = {
  [OATH_ERROR__ALREADY_SETTLED]: OATH_ERROR__ALREADY_SETTLED,
  [OATH_ERROR__ARITHMETIC_OVERFLOW]: OATH_ERROR__ARITHMETIC_OVERFLOW,
  [OATH_ERROR__COMMITMENT_NOT_ACTIVE]: OATH_ERROR__COMMITMENT_NOT_ACTIVE,
  [OATH_ERROR__COMMITMENT_NOT_RESOLVABLE_YET]: OATH_ERROR__COMMITMENT_NOT_RESOLVABLE_YET,
  [OATH_ERROR__COMMITMENT_NOT_STARTED]: OATH_ERROR__COMMITMENT_NOT_STARTED,
  [OATH_ERROR__INSUFFICIENT_VAULT_BALANCE]: OATH_ERROR__INSUFFICIENT_VAULT_BALANCE,
  [OATH_ERROR__INVALID_BELIEVER_POOL]: OATH_ERROR__INVALID_BELIEVER_POOL,
  [OATH_ERROR__INVALID_PROOF_THRESHOLD]: OATH_ERROR__INVALID_PROOF_THRESHOLD,
  [OATH_ERROR__INVALID_STAKE]: OATH_ERROR__INVALID_STAKE,
  [OATH_ERROR__INVALID_TIME_RANGE]: OATH_ERROR__INVALID_TIME_RANGE,
  [OATH_ERROR__PROOF_DAY_OUT_OF_RANGE]: OATH_ERROR__PROOF_DAY_OUT_OF_RANGE,
  [OATH_ERROR__UNAUTHORIZED_BELIEVER]: OATH_ERROR__UNAUTHORIZED_BELIEVER,
  [OATH_ERROR__UNAUTHORIZED_MAKER]: OATH_ERROR__UNAUTHORIZED_MAKER,
  [OATH_ERROR__UNAUTHORIZED_RESOLVER]: OATH_ERROR__UNAUTHORIZED_RESOLVER,
};

const INSUFFICIENT_CREDIT_ERROR =
  "Attempt to debit an account but found no record of a prior credit";
const INSUFFICIENT_CREDIT_ERROR_CODE = "Solana error #7050003";
const PROGRAM_DOES_NOT_EXIST_ERROR = "Attempt to load a program that does not exist";

export function parseTransactionError(err: unknown): string {
  console.error("Transaction error caught:", err);
  // Wallet rejection (comes from wallet-standard, not a SolanaError)
  if (err instanceof Error && err.message.includes("User rejected")) {
    return "Transaction was rejected by the wallet.";
  }

  // Anchor custom program errors — use the Codama-generated error messages
  if (
    isSolanaError(err, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM) &&
    typeof err.context?.code === "number"
  ) {
    const code = err.context.code;
    const vaultError = VAULT_ERROR_CODES[code];
    if (vaultError !== undefined) {
      return getVaultErrorMessage(vaultError);
    }

    const oathError = OATH_ERROR_CODES[code];
    if (oathError !== undefined) {
      return getOathErrorMessage(oathError);
    }

    // Handle standard Anchor errors (2000-2010 range)
    if (code === 2005) return "Account already initialized (Day proof already submitted?)";
    if (code === 2006) return "PDA seed mismatch. The proof day or commitment address is invalid.";
    if (code === 2000 || code === 2002) return "Signature verification failed (You are not the maker).";
    
    return `On-chain error: 0x${code.toString(16)} (${code})`;
  }

  const message = getDeepestMessage(err);

  if (
    message.includes(INSUFFICIENT_CREDIT_ERROR) ||
    message.includes(INSUFFICIENT_CREDIT_ERROR_CODE)
  ) {
    return [
      "The selected wallet or fee payer has no SOL on this cluster.",
      "Switch to the correct cluster, fund the wallet there, and try again.",
    ].join(" ");
  }

  if (message.includes("already in use") && message.includes("Allocate:")) {
    return "This day's proof is already recorded on-chain. Your database might be out of sync, please refresh the page.";
  }

  if (message.includes(PROGRAM_DOES_NOT_EXIST_ERROR)) {
    return getOathProgramMissingErrorMessage("this cluster");
  }

  // For all other errors, kit's SolanaError already has readable messages.
  // Walk the cause chain to find the deepest message.
  return message.length > 200 ? `${message.slice(0, 200)}...` : message;
}

function getDeepestMessage(err: unknown): string {
  let deepest = err instanceof Error ? err.message : String(err);
  let current: unknown = err;

  while (current instanceof Error && current.cause) {
    current = current.cause;
    if (current instanceof Error) {
      deepest = current.message;
    }
  }

  return deepest;
}
