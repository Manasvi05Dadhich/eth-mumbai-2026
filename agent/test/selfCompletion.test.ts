import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkSelfCompletion } from "../src/checks/selfCompletion.js";
import type { BountyPostedEvent, WorkApprovedEvent } from "../src/types.js";
import type { ChainReader } from "../src/services/chainReader.js";

function createMockChainReader(fundingSources: Record<string, string>): ChainReader {
    return {
        getFundingSource: async (address: string) => {
            return fundingSources[address.toLowerCase()] ?? null;
        },
    } as unknown as ChainReader;
}

describe("Self-Completion Detection", () => {
    it("flags when protocol and contributor have same funding source", async () => {
        const posted: BountyPostedEvent[] = [
            {
                bountyId: 1,
                protocol: "0xProtocol",
                categoryId: 0,
                deadline: 999999,
                blockTimestamp: 1000,
            },
        ];

        const approved: WorkApprovedEvent[] = [
            {
                bountyId: 1,
                winner: "0xContributor",
                blockTimestamp: 2000,
            },
        ];

        const chainReader = createMockChainReader({
            "0xprotocol": "0xparent123",
            "0xcontributor": "0xparent123",
        });

        const result = await checkSelfCompletion({
            postedEvents: posted,
            approvedEvents: approved,
            chainReader,
        });

        assert.equal(result.flagged.length, 1);
        assert.ok(result.flagged[0].reason.includes("Self-completion"));
        assert.equal(result.flagged[0].fundingSource, "0xparent123");
        assert.equal(result.clean.length, 0);
    });
});
