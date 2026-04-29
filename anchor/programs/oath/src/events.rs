use anchor_lang::prelude::*;

#[event]
pub struct CommitmentCreated {
    pub commitment: Pubkey,
    pub maker: Pubkey,
    pub stake_lamports: u64,
    pub total_days: u32,
    pub timestamp: i64,
}

#[event]
pub struct ProofSubmitted {
    pub commitment: Pubkey,
    pub day_number: u32,
    pub content_hash: [u8; 32],
    pub proof_count: u32,
    pub timestamp: i64,
}

#[event]
pub struct BeliefStaked {
    pub commitment: Pubkey,
    pub believer: Pubkey,
    pub stake_lamports: u64,
    pub timestamp: i64,
}

#[event]
pub struct CommitmentResolved {
    pub commitment: Pubkey,
    pub maker: Pubkey,
    pub completion_ratio: f64,
    pub maker_refund: u64,
    pub faith_fee_pool: u64,
    pub slash_amount: u64,
    pub timestamp: i64,
}

