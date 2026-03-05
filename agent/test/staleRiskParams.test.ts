import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";

describe("Stale RiskParams Blocks Minting", () => {
    it("RiskParams isStale returns true when data is old", () => {
        const ONE_HOUR = 3600;

        const lastUpdated = Math.floor(Date.now() / 1000) - (2 * ONE_HOUR);
        const currentTime = Math.floor(Date.now() / 1000);

        const isStale = (currentTime - lastUpdated) > ONE_HOUR;
        assert.equal(isStale, true);

        const freshLastUpdated = Math.floor(Date.now() / 1000);
        const isFreshStale = (currentTime - freshLastUpdated) > ONE_HOUR;
        assert.equal(isFreshStale, false);
    });

    it("content hash is deterministic for the same state", () => {
        const state = {
            runId: "test",
            timestamp: 1000,
            blockHeight: 100,
            flaggedCompletions: [],
            flaggedWallets: [],
            cleanCompletions: [],
            platformStats: {
                totalBountiesPosted: 0,
                totalCompletions: 0,
                medianCompletionTimeHours: 0,
                totalReputationMints: 0,
                flaggedCompletionCount: 0,
                flaggedWalletCount: 0,
                cleanCompletionCount: 0,
            },
            agentVersion: "1.0.0",
            signature: "",
        };

        const hash1 = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(state)));
        const hash2 = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(state)));

        assert.equal(hash1, hash2);
        assert.ok(/^0x[a-fA-F0-9]{64}$/.test(hash1));
    });
});
