fn main(
    completions_count: u32,
    approval_rate: u32, 
    _earnings_tier: u32, 
    wallet_age_months: u32,
    score_band: pub u32
) {
    
    assert(wallet_age_months >= 1);

    
    let mut computed_band: u32 = 0;

    if (approval_rate > 92) & (completions_count >= 25) {
        computed_band = 4;
    } else if (approval_rate > 85) & (completions_count >= 15) {
        computed_band = 3;
    } else if (approval_rate > 75) & (completions_count >= 8) {
        computed_band = 2;
    } else if (approval_rate > 60) & (completions_count >= 3) {
        computed_band = 1;
    } else {
        computed_band = 0;
    }

    
    assert(computed_band == score_band);
}

#[test]
fn test_band4_proves() {
    let completions_count = 30;
    let approval_rate = 95;
    let earnings_tier = 3;
    let wallet_age_months = 24;
    let score_band = 4;

    main(completions_count, approval_rate, earnings_tier, wallet_age_months, score_band);
}

#[test]
fn test_band3_boundary() {
    let completions_count = 15;
    let approval_rate = 86; 
    let earnings_tier = 2;
    let wallet_age_months = 12;
    let score_band = 3;

    main(completions_count, approval_rate, earnings_tier, wallet_age_months, score_band);
}

#[test(should_fail)]
fn test_band2_cant_claim_band4() {
    let completions_count = 10; 
    let approval_rate = 80;
    let earnings_tier = 1;
    let wallet_age_months = 6;
    let score_band = 4;

    main(completions_count, approval_rate, earnings_tier, wallet_age_months, score_band);
}

#[test(should_fail)]
fn test_zero_age_fails() {
    let completions_count = 100;
    let approval_rate = 100;
    let earnings_tier = 3;
    let wallet_age_months = 0;
    let score_band = 4;

    main(completions_count, approval_rate, earnings_tier, wallet_age_months, score_band);
}

#[test(should_fail)]
fn test_band2_threshold_fail() {
    let completions_count = 8;
    let approval_rate = 75;
    let earnings_tier = 1;
    let wallet_age_months = 6;
    let score_band = 2;

    main(completions_count, approval_rate, earnings_tier, wallet_age_months, score_band);
}
