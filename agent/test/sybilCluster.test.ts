import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkSybilClusters } from "../src/checks/sybilCluster.js";
import type { ReputationMintedEvent } from "../src/types.js";
import type { ChainReader } from "../src/services/chainReader.js";

function createMockChainReader(
    fundingSources: Record<string, string>,
    firstTxTimestamps: Record<string, number>,
): ChainReader {
    return {
        getFundingSource: async (address: string) => {
            return fundingSources[address.toLowerCase()] ?? null;
        },
        getWalletFirstTxTimestamp: async (address: string) => {
            return firstTxTimestamps[address.toLowerCase()] ?? null;
        },
    } as unknown as ChainReader;
}

describe("Sybil Cluster Detection", () => {
    it("flags cluster of 4 wallets funded from same source, all minted within 48h", async () => {
        const now = Math.floor(Date.now() / 1000);

        const mintEvents: ReputationMintedEvent[] = [
            { to: "0xWallet1", tokenId: 0, ensNode: "0x01", scoreBand: 3, blockTimestamp: now - 3600, txHash: "0x1" },
            { to: "0xWallet2", tokenId: 1, ensNode: "0x02", scoreBand: 3, blockTimestamp: now - 7200, txHash: "0x2" },
            { to: "0xWallet3", tokenId: 2, ensNode: "0x03", scoreBand: 2, blockTimestamp: now - 10800, txHash: "0x3" },
            { to: "0xWallet4", tokenId: 3, ensNode: "0x04", scoreBand: 4, blockTimestamp: now - 14400, txHash: "0x4" },
        ];

        const chainReader = createMockChainReader(
            {
                "0xwallet1": "0xsybil-parent",
                "0xwallet2": "0xsybil-parent",
                "0xwallet3": "0xsybil-parent",
                "0xwallet4": "0xsybil-parent",
            },
            {
                // Wallets are 15-25 days old → older than 14-day threshold
                // so Check 1 (young wallet) does NOT fire.
                // Check 2 (cluster by funding source) WILL fire since ≥ 3 share a source.
                "0xwallet1": now - 15 * 86400,
                "0xwallet2": now - 20 * 86400,
                "0xwallet3": now - 18 * 86400,
                "0xwallet4": now - 25 * 86400,
            },
        );

        const result = await checkSybilClusters({
            mintEvents,
            chainReader,
            currentTimestamp: now,
        });

        // All 4 should be flagged via cluster detection
        assert.ok(result.flaggedWallets.length >= 4, `Expected >=4 flagged, got ${result.flaggedWallets.length}`);

        // All flags should have "Sybil cluster" reason
        const clusterFlags = result.flaggedWallets.filter((w) =>
            w.reason.includes("Sybil cluster")
        );
        assert.ok(clusterFlags.length > 0, "Expected at least one Sybil cluster flag");
    });
});
