import type { ReputationMintedEvent, FlaggedWallet } from "../types";
import type { ChainReader } from "../services/chainReader";

const FOURTEEN_DAYS_SEC = 14 * 24 * 60 * 60;
const FORTY_EIGHT_HOURS_SEC = 48 * 60 * 60;
const SYBIL_CLUSTER_THRESHOLD = 3;

export interface SybilClusterInput {
    mintEvents: ReputationMintedEvent[];
    chainReader: ChainReader;
    currentTimestamp: number;
}

/**
 * Fraud Check 2 — Sybil Cluster Detection
 *
 * 1. For each mint in the last 48h, check if the wallet is < 14 days old
 *    with score band ≥ 2 → flag for review.
 * 2. Cluster recently minted wallets by funding source. If ≥ 3 wallets
 *    share a source and all minted within 48h → flag as Sybil ring.
 */
export async function checkSybilClusters(input: SybilClusterInput): Promise<{
    flaggedWallets: FlaggedWallet[];
}> {
    const { mintEvents, chainReader, currentTimestamp } = input;
    const flaggedWallets: FlaggedWallet[] = [];
    const flaggedAddresses = new Set<string>();

    // Filter to mints in the last 48 hours
    const recentMints = mintEvents.filter(
        (e) => currentTimestamp - e.blockTimestamp < FORTY_EIGHT_HOURS_SEC
    );

    // --- Check 1: Young wallet + high band ---
    for (const mint of recentMints) {
        const firstTx = await chainReader.getWalletFirstTxTimestamp(mint.to);
        if (firstTx === null) continue;

        const walletAgeDays = (currentTimestamp - firstTx) / (24 * 60 * 60);

        if (walletAgeDays < 14 && mint.scoreBand >= 2) {
            if (!flaggedAddresses.has(mint.to.toLowerCase())) {
                flaggedAddresses.add(mint.to.toLowerCase());
                flaggedWallets.push({
                    address: mint.to,
                    reason: `Young wallet (${Math.floor(walletAgeDays)}d old) with high score band ${mint.scoreBand}`,
                    scoreBand: mint.scoreBand,
                    walletAgeDays: Math.floor(walletAgeDays),
                });
            }
        }
    }

    // --- Check 2: Cluster by funding source ---
    const sourceToClusters = new Map<string, string[]>();

    for (const mint of recentMints) {
        const source = await chainReader.getFundingSource(mint.to);
        if (!source) continue;

        const existing = sourceToClusters.get(source) || [];
        existing.push(mint.to.toLowerCase());
        sourceToClusters.set(source, existing);
    }

    for (const [source, wallets] of sourceToClusters) {
        if (wallets.length >= SYBIL_CLUSTER_THRESHOLD) {
            for (const wallet of wallets) {
                if (!flaggedAddresses.has(wallet)) {
                    flaggedAddresses.add(wallet);
                    flaggedWallets.push({
                        address: wallet,
                        reason: `Sybil cluster: ${wallets.length} wallets funded by ${source}, all minted within 48h`,
                        cluster: wallets,
                    });
                }
            }
        }
    }

    return { flaggedWallets };
}
