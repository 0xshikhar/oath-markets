export type CommitmentAccessTarget = {
  isPublic: boolean;
  makerWalletAddress: string;
};

export function sameWalletAddress(
  left?: string | null,
  right?: string | null
) {
  const normalizedLeft = left?.trim();
  const normalizedRight = right?.trim();

  return Boolean(normalizedLeft) && Boolean(normalizedRight) && normalizedLeft === normalizedRight;
}

export function canViewCommitment(
  target: CommitmentAccessTarget,
  viewerWalletAddress?: string | null
) {
  return target.isPublic || sameWalletAddress(target.makerWalletAddress, viewerWalletAddress);
}

export function canWriteCommitment(
  target: CommitmentAccessTarget,
  viewerWalletAddress?: string | null
) {
  return target.isPublic || sameWalletAddress(target.makerWalletAddress, viewerWalletAddress);
}

export function canAccessPrivateCommitment(
  target: CommitmentAccessTarget,
  viewerWalletAddress?: string | null
) {
  return sameWalletAddress(target.makerWalletAddress, viewerWalletAddress);
}

export function commitmentVisibilityLabel(isPublic: boolean) {
  return isPublic ? "Public" : "Private";
}
