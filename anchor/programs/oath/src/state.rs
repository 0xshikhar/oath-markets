use anchor_lang::prelude::*;

#[account]
pub struct CommitmentAccount {
    pub maker: Pubkey,
    pub commitment_id: [u8; 32],
    pub stake_lamports: u64,
    pub total_days: u32,
    pub required_proof_days: u32,
    pub start_timestamp: i64,
    pub end_timestamp: i64,
    pub proof_count: u32,
    pub believer_pool_lamports: u64,
    pub believer_count: u32,
    pub faith_fee_pool_lamports: u64,
    pub resolved_at: i64,
    pub status: CommitmentStatus,
    pub slash_destination: SlashDestination,
    pub is_public: bool,
    pub bump: u8,
}

impl CommitmentAccount {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 4 + 4 + 8 + 8 + 4 + 8 + 4 + 8 + 8 + 1 + 1 + 1 + 1;
}

#[account]
pub struct EscrowVault {
    pub commitment: Pubkey,
    pub bump: u8,
}

impl EscrowVault {
    pub const SPACE: usize = 8 + 32 + 1;
}

#[account]
pub struct ProofRecord {
    pub commitment: Pubkey,
    pub day_number: u32,
    pub content_hash: [u8; 32],
    pub submitted_at: i64,
    pub bump: u8,
}

impl ProofRecord {
    pub const SPACE: usize = 8 + 32 + 4 + 32 + 8 + 1;
}

#[account]
pub struct BelieverRecord {
    pub commitment: Pubkey,
    pub believer: Pubkey,
    pub stake_lamports: u64,
    pub deposited_at: i64,
    pub status: BeliefStatus,
    pub bump: u8,
}

impl BelieverRecord {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 1 + 1;
}

#[account]
pub struct ReputationAccount {
    pub wallet: Pubkey,
    pub oath_score: u32,
    pub completed_count: u32,
    pub failed_count: u32,
    pub total_commitments: u32,
    pub total_believer_trust: u64,
    pub bump: u8,
}

impl ReputationAccount {
    pub const SPACE: usize = 8 + 32 + 4 + 4 + 4 + 4 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum CommitmentStatus {
    Active,
    Completed,
    Failed,
    Abandoned,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum SlashDestination {
    Burn,
    Donate,
    Treasury,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum BeliefStatus {
    Active,
    Won,
    Lost,
}

