import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import type { VerificationState } from "../src/types.js";

describe("Signature Verification", () => {
    it("agent produces state, signs it, recovered address equals agent wallet", async () => {
        const wallet = ethers.Wallet.createRandom();

        const state: VerificationState = {
            runId: "test-run-123",
            timestamp: Math.floor(Date.now() / 1000),
            blockHeight: 12345,
            flaggedCompletions: [],
            flaggedWallets: [],
            cleanCompletions: [
                { bountyId: 1, protocol: "0xProto", winner: "0xWinner" },
            ],
            platformStats: {
                totalBountiesPosted: 10,
                totalCompletions: 5,
                medianCompletionTimeHours: 48,
                totalReputationMints: 3,
                flaggedCompletionCount: 0,
                flaggedWalletCount: 0,
                cleanCompletionCount: 5,
            },
            agentVersion: "1.0.0",
            signature: "",
        };

        const stateForSigning = { ...state, signature: "" };
        const stateHash = ethers.keccak256(
            ethers.toUtf8Bytes(JSON.stringify(stateForSigning))
        );
        const signature = await wallet.signMessage(ethers.getBytes(stateHash));

        const recoveredAddress = ethers.verifyMessage(
            ethers.getBytes(stateHash),
            signature
        );

        assert.equal(recoveredAddress.toLowerCase(), wallet.address.toLowerCase());
    });
});
