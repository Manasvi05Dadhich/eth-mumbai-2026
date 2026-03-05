fn main(
    category_completions: u32,
    wallet_age_months: u32,
    minimum_required: pub u32,
    _category_id: pub u32, // (0=Solidity, 1=Cairo, 2=Frontend, 3=Security, 4=Content, 5=Design)
    is_qualified: pub bool
) {
   
    assert(wallet_age_months >= 1);

    // Boolean check: does contributor meet requirement?
    let qualified = category_completions >= minimum_required;

    // Constraint: Claimed qualification must match actual check
    assert(qualified == is_qualified);

    // (Note: category_id isn't strictly needed for logic here, but is used by frontend to route the proof)
}

#[test]
fn test_above_minimum() {
    let category_completions = 15;
    let wallet_age_months = 12;
    let minimum_required = 10;
    let category_id = 0;
    let is_qualified = true;

    main(category_completions, wallet_age_months, minimum_required, category_id, is_qualified);
}

#[test(should_fail)]
fn test_below_minimum() {
    let category_completions = 8;
    let wallet_age_months = 12;
    let minimum_required = 10;
    let category_id = 0;
    let is_qualified = true; // Claim true but is false

    main(category_completions, wallet_age_months, minimum_required, category_id, is_qualified);
}

#[test]
fn test_at_boundary() {
    let category_completions = 10;
    let wallet_age_months = 12;
    let minimum_required = 10;
    let category_id = 1;
    let is_qualified = true;

    main(category_completions, wallet_age_months, minimum_required, category_id, is_qualified);
}

#[test(should_fail)]
fn test_zero_age_fails() {
    let category_completions = 20;
    let wallet_age_months = 0;
    let minimum_required = 5;
    let category_id = 3;
    let is_qualified = true;

    main(category_completions, wallet_age_months, minimum_required, category_id, is_qualified);
}
