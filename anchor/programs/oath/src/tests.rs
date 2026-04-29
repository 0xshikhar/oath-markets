use super::{completion_ratio, reputation_delta, reputation_penalty, resolution_breakdown};

#[test]
fn full_completion_returns_eighty_five_percent_to_maker_and_five_percent_fee_pool() {
    let breakdown = resolution_breakdown(2_000_000_000, 30, 30, 500_000_000).unwrap();
    assert_eq!(breakdown.maker_refund, 1_900_000_000);
    assert_eq!(breakdown.faith_fee_pool, 100_000_000);
    assert_eq!(breakdown.slash_amount, 0);
    assert!((breakdown.completion_ratio - 1.0).abs() < f64::EPSILON);
}

#[test]
fn partial_completion_caps_refund_at_proportion_of_stake() {
    let breakdown = resolution_breakdown(1_000_000_000, 21, 30, 250_000_000).unwrap();
    assert_eq!(breakdown.maker_refund, 665_000_000);
    assert_eq!(breakdown.faith_fee_pool, 35_000_000);
    assert_eq!(breakdown.slash_amount, 300_000_000);
    assert!((completion_ratio(21, 30).unwrap() - 0.7).abs() < 0.0001);
}

#[test]
fn failed_commitment_slashes_the_full_stake() {
    let breakdown = resolution_breakdown(100_000_000, 0, 30, 0).unwrap();
    assert_eq!(breakdown.maker_refund, 0);
    assert_eq!(breakdown.faith_fee_pool, 0);
    assert_eq!(breakdown.slash_amount, 100_000_000);
}

#[test]
fn reputation_math_moves_in_the_expected_direction() {
    let completed = reputation_delta(2_000_000_000, 1.0);
    let failed = reputation_penalty(2_000_000_000, 9);
    assert!(completed > 100);
    assert!(failed > 50);
}

