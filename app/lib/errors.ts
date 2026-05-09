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
import { getOathProgramMissingErrorMessage } from "./oath-program";

const VAULT_ERROR_CODES: Record<number, VaultError> = {
  [VAULT_ERROR__VAULT_ALREADY_EXISTS]: VAULT_ERROR__VAULT_ALREADY_EXISTS,
  [VAULT_ERROR__INVALID_AMOUNT]: VAULT_ERROR__INVALID_AMOUNT,
};

const INSUFFICIENT_CREDIT_ERROR =
  "Attempt to debit an account but found no record of a prior credit";
const INSUFFICIENT_CREDIT_ERROR_CODE = "Solana error #7050003";
const PROGRAM_DOES_NOT_EXIST_ERROR = "Attempt to load a program that does not exist";

export function parseTransactionError(err: unknown): string {
  // Wallet rejection (comes from wallet-standard, not a SolanaError)
  if (err instanceof Error && err.message.includes("User rejected")) {
    return "Transaction was rejected by the wallet.";
  }

  // Anchor custom program errors — use the Codama-generated error messages
  if (
    isSolanaError(err, SOLANA_ERROR__INSTRUCTION_ERROR__CUSTOM) &&
    typeof err.context?.code === "number"
  ) {
    const vaultError = VAULT_ERROR_CODES[err.context.code];
    if (vaultError !== undefined) {
      return getVaultErrorMessage(vaultError);
    }
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
