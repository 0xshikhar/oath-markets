use anchor_lang::prelude::*;

#[error_code]
pub enum OathError {
    #[msg("Stake amount is below the minimum required amount")]
    InvalidStake,
    #[msg("The commitment time window is invalid")]
    InvalidTimeRange,
    #[msg("Required proof days must be greater than zero")]
    InvalidProofThreshold,
    #[msg("Commitment is not active")]
    CommitmentNotActive,
    #[msg("Commitment is not ready to resolve")]
    CommitmentNotResolvableYet,
    #[msg("Commitment has not started yet")]
    CommitmentNotStarted,
    #[msg("Proof day is out of range")]
    ProofDayOutOfRange,
    #[msg("Signer is not authorized to resolve this commitment")]
    UnauthorizedResolver,
    #[msg("Signer is not authorized for this commitment")]
    UnauthorizedMaker,
    #[msg("Believer account does not match the expected wallet")]
    UnauthorizedBeliever,
    #[msg("This account has already been settled")]
    AlreadySettled,
    #[msg("Belief pool is invalid")]
    InvalidBelieverPool,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Vault balance is insufficient for this transfer")]
    InsufficientVaultBalance,
}

