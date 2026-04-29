use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

mod errors;
mod events;
mod logic;
mod state;

#[cfg(test)]
mod tests;

pub use errors::OathError;
pub use events::*;
pub use logic::*;
pub use state::*;

declare_id!("CHyHVL8HzWw3VaZarPUuU2DNf5xJm3CkrrWz6GgYstBJ");

pub const OATH_AUTHORITY: Pubkey = pubkey!("nmc44fEy5g34tCgzeNKECSFCaaNSckzfSLu9YfZv3bs");
pub const MIN_STAKE_LAMPORTS: u64 = 100_000_000;
pub const MIN_BELIEF_STAKE_LAMPORTS: u64 = 50_000_000;
pub const PROOF_GRACE_PERIOD_SECONDS: i64 = 86_400;

#[program]
pub mod oath {
    use super::*;

    pub fn create_commitment(
        ctx: Context<CreateCommitment>,
        commitment_id: [u8; 32],
        total_days: u32,
        required_proof_days: u32,
        start_timestamp: i64,
        end_timestamp: i64,
        stake_lamports: u64,
        slash_destination: SlashDestination,
        is_public: bool,
    ) -> Result<()> {
        require!(stake_lamports >= MIN_STAKE_LAMPORTS, OathError::InvalidStake);
        require!(total_days > 0, OathError::InvalidProofThreshold);
        require!(required_proof_days > 0, OathError::InvalidProofThreshold);
        require!(required_proof_days <= total_days, OathError::InvalidProofThreshold);
        require!(end_timestamp > start_timestamp, OathError::InvalidTimeRange);

        let now = Clock::get()?.unix_timestamp;

        let commitment = &mut ctx.accounts.commitment_account;
        commitment.maker = ctx.accounts.maker.key();
        commitment.commitment_id = commitment_id;
        commitment.stake_lamports = stake_lamports;
        commitment.total_days = total_days;
        commitment.required_proof_days = required_proof_days;
        commitment.start_timestamp = start_timestamp;
        commitment.end_timestamp = end_timestamp;
        commitment.proof_count = 0;
        commitment.believer_pool_lamports = 0;
        commitment.believer_count = 0;
        commitment.faith_fee_pool_lamports = 0;
        commitment.resolved_at = 0;
        commitment.status = CommitmentStatus::Active;
        commitment.slash_destination = slash_destination;
        commitment.is_public = is_public;
        commitment.bump = ctx.bumps.commitment_account;

        let reputation = &mut ctx.accounts.reputation;
        reputation.wallet = ctx.accounts.maker.key();
        reputation.bump = ctx.bumps.reputation;
        reputation.total_commitments = reputation
            .total_commitments
            .checked_add(1)
            .ok_or(OathError::ArithmeticOverflow)?;

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.maker.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            stake_lamports,
        )?;

        let vault = &mut ctx.accounts.vault;
        vault.commitment = commitment.key();
        vault.bump = ctx.bumps.vault;

        emit!(CommitmentCreated {
            commitment: commitment.key(),
            maker: ctx.accounts.maker.key(),
            stake_lamports,
            total_days,
            timestamp: now,
        });

        Ok(())
    }

    pub fn submit_proof(
        ctx: Context<SubmitProof>,
        day_number: u32,
        content_hash: [u8; 32],
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let commitment = &mut ctx.accounts.commitment_account;

        require_keys_eq!(ctx.accounts.maker.key(), commitment.maker, OathError::UnauthorizedMaker);
        require!(commitment.status == CommitmentStatus::Active, OathError::CommitmentNotActive);
        require!(now >= commitment.start_timestamp, OathError::CommitmentNotStarted);
        require!(
            now <= commitment.end_timestamp + PROOF_GRACE_PERIOD_SECONDS,
            OathError::CommitmentNotResolvableYet
        );
        require!(day_number > 0 && day_number <= commitment.total_days, OathError::ProofDayOutOfRange);

        let proof = &mut ctx.accounts.proof_record;
        proof.commitment = commitment.key();
        proof.day_number = day_number;
        proof.content_hash = content_hash;
        proof.submitted_at = now;
        proof.bump = ctx.bumps.proof_record;

        commitment.proof_count = commitment
            .proof_count
            .checked_add(1)
            .ok_or(OathError::ArithmeticOverflow)?;

        emit!(ProofSubmitted {
            commitment: commitment.key(),
            day_number,
            content_hash,
            proof_count: commitment.proof_count,
            timestamp: now,
        });

        Ok(())
    }

pub fn co_stake_belief(ctx: Context<CoStakeBelief>, stake_lamports: u64) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(
            stake_lamports >= MIN_BELIEF_STAKE_LAMPORTS,
            OathError::InvalidStake
        );

        let commitment = &mut ctx.accounts.commitment_account;
        require!(commitment.status == CommitmentStatus::Active, OathError::CommitmentNotActive);
        require!(now < commitment.end_timestamp, OathError::CommitmentNotResolvableYet);

        let believer_record = &mut ctx.accounts.believer_record;
        believer_record.commitment = commitment.key();
        believer_record.believer = ctx.accounts.believer_wallet.key();
        believer_record.stake_lamports = stake_lamports;
        believer_record.deposited_at = now;
        believer_record.status = BeliefStatus::Active;
        believer_record.bump = ctx.bumps.believer_record;

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.believer_wallet.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            stake_lamports,
        )?;

        commitment.believer_pool_lamports = commitment
            .believer_pool_lamports
            .checked_add(stake_lamports)
            .ok_or(OathError::ArithmeticOverflow)?;
        commitment.believer_count = commitment
            .believer_count
            .checked_add(1)
            .ok_or(OathError::ArithmeticOverflow)?;

        let reputation = &mut ctx.accounts.reputation;
        reputation.wallet = commitment.maker;
        reputation.total_believer_trust = reputation
            .total_believer_trust
            .checked_add(stake_lamports)
            .ok_or(OathError::ArithmeticOverflow)?;

        emit!(BeliefStaked {
            commitment: commitment.key(),
            believer: ctx.accounts.believer_wallet.key(),
            stake_lamports,
            timestamp: now,
        });

        Ok(())
    }

    pub fn resolve_commitment(ctx: Context<ResolveCommitment>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let commitment = &mut ctx.accounts.commitment_account;

        require!(
            commitment.status == CommitmentStatus::Active,
            OathError::CommitmentNotActive
        );
        require!(now > commitment.end_timestamp, OathError::CommitmentNotResolvableYet);

        let resolver_key = ctx.accounts.resolver.key();
        require!(
            resolver_key == OATH_AUTHORITY || resolver_key == commitment.maker,
            OathError::UnauthorizedResolver
        );

        let reputation = &mut ctx.accounts.reputation;
        require_keys_eq!(reputation.wallet, commitment.maker, OathError::UnauthorizedMaker);

        let breakdown = resolution_breakdown(
            commitment.stake_lamports,
            commitment.proof_count,
            commitment.required_proof_days,
            commitment.believer_pool_lamports,
        )?;

        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        let required_outflow = breakdown
            .maker_refund
            .checked_add(breakdown.slash_amount)
            .ok_or(OathError::ArithmeticOverflow)?;
        require!(vault_balance >= required_outflow, OathError::InsufficientVaultBalance);

        let vault_bump = ctx.accounts.vault.bump;
        let commitment_key = commitment.key();
        let vault_seeds: &[&[&[u8]]] = &[&[
            b"vault",
            commitment_key.as_ref(),
            &[vault_bump],
        ]];

        if breakdown.maker_refund > 0 {
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.maker.to_account_info(),
                    },
                    vault_seeds,
                ),
                breakdown.maker_refund,
            )?;
        }

        if breakdown.slash_amount > 0 {
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.treasury.to_account_info(),
                    },
                    vault_seeds,
                ),
                breakdown.slash_amount,
            )?;
        }

        commitment.faith_fee_pool_lamports = breakdown.faith_fee_pool;
        commitment.resolved_at = now;
        commitment.status = if (breakdown.completion_ratio - 1.0).abs() < f64::EPSILON {
            CommitmentStatus::Completed
        } else {
            CommitmentStatus::Failed
        };

        if commitment.status == CommitmentStatus::Completed {
            reputation.completed_count = reputation
                .completed_count
                .checked_add(1)
                .ok_or(OathError::ArithmeticOverflow)?;
            reputation.oath_score = reputation.oath_score.saturating_add(reputation_delta(
                commitment.stake_lamports,
                breakdown.completion_ratio,
            ));
        } else {
            reputation.failed_count = reputation
                .failed_count
                .checked_add(1)
                .ok_or(OathError::ArithmeticOverflow)?;
            let missing_proof_days = commitment
                .required_proof_days
                .saturating_sub(commitment.proof_count.min(commitment.required_proof_days));
            let penalty = reputation_penalty(commitment.stake_lamports, missing_proof_days);
            reputation.oath_score = reputation.oath_score.saturating_sub(penalty);
        }

        emit!(CommitmentResolved {
            commitment: commitment.key(),
            maker: commitment.maker,
            completion_ratio: breakdown.completion_ratio,
            maker_refund: breakdown.maker_refund,
            faith_fee_pool: breakdown.faith_fee_pool,
            slash_amount: breakdown.slash_amount,
            timestamp: now,
        });

        Ok(())
    }

    pub fn settle_believer(ctx: Context<SettleBeliever>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let commitment = &mut ctx.accounts.commitment_account;
        let believer_record = &mut ctx.accounts.believer_record;

        require!(commitment.status != CommitmentStatus::Active, OathError::CommitmentNotResolvableYet);
        require!(believer_record.status == BeliefStatus::Active, OathError::AlreadySettled);
        require_keys_eq!(
            believer_record.believer,
            ctx.accounts.believer_wallet.key(),
            OathError::UnauthorizedBeliever
        );
        require_keys_eq!(
            believer_record.commitment,
            commitment.key(),
            OathError::UnauthorizedBeliever
        );
        require!(
            commitment.believer_pool_lamports >= believer_record.stake_lamports,
            OathError::InvalidBelieverPool
        );

        let vault_balance = ctx.accounts.vault.to_account_info().lamports();
        let payout = if commitment.status == CommitmentStatus::Completed {
            if commitment.believer_pool_lamports == 0 || commitment.faith_fee_pool_lamports == 0 {
                believer_record.stake_lamports
            } else {
                let share = (commitment
                    .faith_fee_pool_lamports as u128)
                    .checked_mul(believer_record.stake_lamports as u128)
                    .ok_or(OathError::ArithmeticOverflow)?
                    .checked_div(commitment.believer_pool_lamports as u128)
                    .ok_or(OathError::ArithmeticOverflow)?;
                believer_record
                    .stake_lamports
                    .checked_add(share.try_into().map_err(|_| OathError::ArithmeticOverflow)?)
                    .ok_or(OathError::ArithmeticOverflow)?
            }
        } else {
            believer_record.stake_lamports
        };

        require!(vault_balance >= payout, OathError::InsufficientVaultBalance);

        let vault_bump = ctx.accounts.vault.bump;
        let commitment_key = commitment.key();
        let vault_seeds: &[&[&[u8]]] = &[&[
            b"vault",
            commitment_key.as_ref(),
            &[vault_bump],
        ]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.believer_wallet.to_account_info(),
                },
                vault_seeds,
            ),
            payout,
        )?;

        believer_record.status = if commitment.status == CommitmentStatus::Completed {
            BeliefStatus::Won
        } else {
            BeliefStatus::Lost
        };

        let _ = now;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(commitment_id: [u8; 32])]
pub struct CreateCommitment<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        init,
        payer = maker,
        seeds = [b"commitment", maker.key().as_ref(), commitment_id.as_ref()],
        bump,
        space = CommitmentAccount::SPACE,
    )]
    pub commitment_account: Account<'info, CommitmentAccount>,
    #[account(
        init,
        payer = maker,
        seeds = [b"vault", commitment_account.key().as_ref()],
        bump,
        space = EscrowVault::SPACE,
    )]
    pub vault: Account<'info, EscrowVault>,
    #[account(
        init_if_needed,
        payer = maker,
        seeds = [b"reputation", maker.key().as_ref()],
        bump,
        space = ReputationAccount::SPACE,
    )]
    pub reputation: Account<'info, ReputationAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(day_number: u32)]
pub struct SubmitProof<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"commitment",
            commitment_account.maker.as_ref(),
            commitment_account.commitment_id.as_ref()
        ],
        bump = commitment_account.bump,
    )]
    pub commitment_account: Account<'info, CommitmentAccount>,
    #[account(
        init,
        payer = maker,
        seeds = [b"proof", commitment_account.key().as_ref(), &day_number.to_le_bytes()],
        bump,
        space = ProofRecord::SPACE,
    )]
    pub proof_record: Account<'info, ProofRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CoStakeBelief<'info> {
    #[account(mut)]
    pub believer_wallet: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"commitment",
            commitment_account.maker.as_ref(),
            commitment_account.commitment_id.as_ref()
        ],
        bump = commitment_account.bump,
    )]
    pub commitment_account: Account<'info, CommitmentAccount>,
    #[account(
        init,
        payer = believer_wallet,
        seeds = [
            b"believer",
            commitment_account.key().as_ref(),
            believer_wallet.key().as_ref()
        ],
        bump,
        space = BelieverRecord::SPACE,
    )]
    pub believer_record: Account<'info, BelieverRecord>,
    #[account(
        mut,
        seeds = [b"vault", commitment_account.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, EscrowVault>,
    #[account(
        mut,
        seeds = [b"reputation", commitment_account.maker.as_ref()],
        bump = reputation.bump,
    )]
    pub reputation: Account<'info, ReputationAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveCommitment<'info> {
    #[account(mut)]
    pub resolver: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"commitment",
            commitment_account.maker.as_ref(),
            commitment_account.commitment_id.as_ref()
        ],
        bump = commitment_account.bump,
    )]
    pub commitment_account: Account<'info, CommitmentAccount>,
    #[account(
        mut,
        seeds = [b"vault", commitment_account.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, EscrowVault>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"reputation", commitment_account.maker.as_ref()],
        bump = reputation.bump,
    )]
    pub reputation: Account<'info, ReputationAccount>,
    #[account(mut)]
    pub treasury: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SettleBeliever<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"commitment",
            commitment_account.maker.as_ref(),
            commitment_account.commitment_id.as_ref()
        ],
        bump = commitment_account.bump,
    )]
    pub commitment_account: Account<'info, CommitmentAccount>,
    #[account(
        mut,
        seeds = [b"believer", commitment_account.key().as_ref(), believer_wallet.key().as_ref()],
        bump = believer_record.bump,
    )]
    pub believer_record: Account<'info, BelieverRecord>,
    #[account(
        mut,
        seeds = [b"vault", commitment_account.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, EscrowVault>,
    #[account(mut)]
    pub believer_wallet: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}
