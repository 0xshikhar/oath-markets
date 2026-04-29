use crate::errors::OathError;
use anchor_lang::prelude::*;

pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ResolutionBreakdown {
    pub maker_refund: u64,
    pub faith_fee_pool: u64,
    pub slash_amount: u64,
    pub completion_ratio: f64,
}

pub fn completion_ratio(proof_count: u32, required_proof_days: u32) -> Result<f64> {
    require!(required_proof_days > 0, OathError::InvalidProofThreshold);

    let capped = proof_count.min(required_proof_days);
    Ok(capped as f64 / required_proof_days as f64)
}

pub fn resolution_breakdown(
    stake_lamports: u64,
    proof_count: u32,
    required_proof_days: u32,
    believer_pool_lamports: u64,
) -> Result<ResolutionBreakdown> {
    require!(required_proof_days > 0, OathError::InvalidProofThreshold);

    let completion_ratio = completion_ratio(proof_count, required_proof_days)?;
    let completed_proofs = proof_count.min(required_proof_days) as u128;
    let required_proofs = required_proof_days as u128;
    let stake = stake_lamports as u128;

    let refundable = stake
        .checked_mul(completed_proofs)
        .ok_or(OathError::ArithmeticOverflow)?
        .checked_div(required_proofs)
        .ok_or(OathError::ArithmeticOverflow)?;

    let maker_refund = refundable
        .checked_mul(95)
        .ok_or(OathError::ArithmeticOverflow)?
        .checked_div(100)
        .ok_or(OathError::ArithmeticOverflow)?;
    let faith_fee_pool = if believer_pool_lamports == 0 {
        0
    } else {
        refundable
            .checked_sub(maker_refund)
            .ok_or(OathError::ArithmeticOverflow)?
    };

    let slash_amount = stake
        .checked_sub(maker_refund)
        .ok_or(OathError::ArithmeticOverflow)?
        .checked_sub(faith_fee_pool)
        .ok_or(OathError::ArithmeticOverflow)?;

    Ok(ResolutionBreakdown {
        maker_refund: maker_refund.try_into().map_err(|_| OathError::ArithmeticOverflow)?,
        faith_fee_pool: faith_fee_pool.try_into().map_err(|_| OathError::ArithmeticOverflow)?,
        slash_amount: slash_amount.try_into().map_err(|_| OathError::ArithmeticOverflow)?,
        completion_ratio,
    })
}

pub fn reputation_delta(stake_lamports: u64, completion_ratio: f64) -> u32 {
    let stake_sol = stake_lamports as f64 / LAMPORTS_PER_SOL as f64;
    let stake_weight = ((stake_sol + 1.0).ln() * 10.0).round().max(0.0) as u32;
    let consistency_bonus = if (completion_ratio - 1.0).abs() < f64::EPSILON {
        20
    } else {
        0
    };

    100u32
        .saturating_add(stake_weight)
        .saturating_add(consistency_bonus)
}

pub fn reputation_penalty(stake_lamports: u64, missing_proof_days: u32) -> u32 {
    let stake_sol = stake_lamports as f64 / LAMPORTS_PER_SOL as f64;
    let stake_weight = (stake_sol.sqrt() * 8.0).round().max(0.0) as u32;
    50u32
        .saturating_add(missing_proof_days.saturating_mul(3))
        .saturating_add(stake_weight)
}
