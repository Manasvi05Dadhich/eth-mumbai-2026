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

describe("Clean Completions Not Flagged", () => {
    it("does not flag when protocol and contributor have different funding sources", async () => {
        const posted: BountyPostedEvent[] = [
            {
                bountyId: 1,
                protocol: "0xProtocol",
                categoryId: 0,
                deadline: 999999,
                blockTimestamp: 1000,
            },
            {
                bountyId: 2,
                protocol: "0xProtocol2",
                categoryId: 1,
                deadline: 999999,
                blockTimestamp: 1100,
            },
        ];

        const approved: WorkApprovedEvent[] = [
            {
                bountyId: 1,
                winner: "0xContributor1",
                blockTimestamp: 2000,
            },
            {
                bountyId: 2,
                winner: "0xContributor2",
                blockTimestamp: 2100,
            },
        ];

        const chainReader = createMockChainReader({
            "0xprotocol": "0xfunderA",
            "0xcontributor1": "0xfunderB",
            "0xprotocol2": "0xfunderC",
            "0xcontributor2": "0xfunderD",
        });

        const result = await checkSelfCompletion({
            postedEvents: posted,
            approvedEvents: approved,
            chainReader,
        });

        assert.equal(result.flagged.length, 0);
        assert.equal(result.clean.length, 2);
        assert.equal(result.clean[0].bountyId, 1);
        assert.equal(result.clean[1].bountyId, 2);
    });
});
