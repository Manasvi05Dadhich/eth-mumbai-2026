import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkVelocityAnomalies } from "../src/checks/velocityAnomaly.js";
import type { BountyPostedEvent, WorkApprovedEvent } from "../src/types.js";

describe("Velocity Anomaly Detection", () => {
    it("flags 5-minute completions against 10-hour platform median", () => {
        const now = Math.floor(Date.now() / 1000);
        const HOURS_10 = 10 * 3600; // 36000s — normal completion time

        const posted: BountyPostedEvent[] = [];
        const approved: WorkApprovedEvent[] = [];

        // 50 normal completions all at exactly 10h, posted 30-90 days ago
        // (outside 7-day recent window so they don't appear as recent)
        for (let i = 0; i < 50; i++) {
            const postTime = now - (90 - i) * 86400; // 90 to 41 days ago
            posted.push({
                bountyId: i,
                protocol: `0xProtocol${i}`,
                categoryId: 0,
                deadline: postTime + 365 * 86400,
                blockTimestamp: postTime,
            });
            approved.push({
                bountyId: i,
                winner: `0xNormalContrib${i}`,
                blockTimestamp: postTime + HOURS_10,
            });
        }

        // 4 suspicious completions at 5 minutes (300s), posted in last 7 days
        // With 50 normal completions as anchors, stdDev stays small and threshold > 0
        for (let i = 50; i < 54; i++) {
            const postTime = now - 3 * 86400 + (i - 50) * 3600; // 3 days ago
            posted.push({
                bountyId: i,
                protocol: `0xSusProtocol`,
                categoryId: 0,
                deadline: postTime + 365 * 86400,
                blockTimestamp: postTime,
            });
            approved.push({
                bountyId: i,
                winner: "0xSpeedyContrib",
                blockTimestamp: postTime + 300, // 5 minutes
            });
        }

        const result = checkVelocityAnomalies({
            postedEvents: posted,
            approvedEvents: approved,
            currentTimestamp: now,
        });

        assert.ok(result.flagged.length > 0, "Expected at least one flagged velocity anomaly");
        assert.ok(
            result.flagged.every((f) => f.winner === "0xspeedycontrib"),
            "Expected all flagged entries to be 0xspeedycontrib"
        );
        assert.ok(result.flagged[0].reason.includes("Velocity anomaly"), "Expected 'Velocity anomaly' in reason");
        assert.ok(result.medianCompletionTimeHours > 0, "Expected positive median completion time");
    });
});
