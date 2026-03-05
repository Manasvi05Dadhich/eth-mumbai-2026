// ─── Verification State ────────────────────────────────────────
export interface FlaggedCompletion {
    bountyId: number;
    protocol: string;
    winner: string;
    reason: string;
    fundingSource?: string;
}

export interface FlaggedWallet {
    address: string;
    reason: string;
    cluster?: string[];
    scoreBand?: number;
    walletAgeDays?: number;
}

export interface CleanCompletion {
    bountyId: number;
    protocol: string;
    winner: string;
}

export interface PlatformStats {
    totalBountiesPosted: number;
    totalCompletions: number;
    medianCompletionTimeHours: number;
    totalReputationMints: number;
    flaggedCompletionCount: number;
    flaggedWalletCount: number;
    cleanCompletionCount: number;
}

export interface VerificationState {
    runId: string;
    timestamp: number;
    blockHeight: number;
    flaggedCompletions: FlaggedCompletion[];
    flaggedWallets: FlaggedWallet[];
    cleanCompletions: CleanCompletion[];
    platformStats: PlatformStats;
    agentVersion: string;
    signature: string;
}

// ─── Event Data ────────────────────────────────────────────────
export interface BountyPostedEvent {
    bountyId: number;
    protocol: string;
    categoryId: number;
    deadline: number;
    blockTimestamp: number;
}

export interface WorkApprovedEvent {
    bountyId: number;
    winner: string;
    blockTimestamp: number;
}

export interface ReputationMintedEvent {
    to: string;
    tokenId: number;
    ensNode: string;
    scoreBand: number;
    blockTimestamp: number;
    txHash: string;
}

// ─── Alchemy Types ─────────────────────────────────────────────
export interface AssetTransfer {
    from: string;
    to: string;
    value: number;
    blockNum: string;
    hash: string;
}

// ─── Fraud Check Results ───────────────────────────────────────
export interface FraudCheckResult {
    flaggedCompletions: FlaggedCompletion[];
    flaggedWallets: FlaggedWallet[];
    cleanCompletions: CleanCompletion[];
}
