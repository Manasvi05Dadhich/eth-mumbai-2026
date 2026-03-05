import type {
    BountyPostedEvent,
    WorkApprovedEvent,
    FlaggedCompletion,
} from "../types";

const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;

export interface VelocityInput {
    postedEvents: BountyPostedEvent[];
    approvedEvents: WorkApprovedEvent[];
    currentTimestamp: number;
}

/**
 * Fraud Check 3 — Velocity Anomaly Detection
 *
 * Calculates the platform median completion time (BountyPosted → WorkApproved).
 * For each contributor with completions in the last 7 days, calculates their
 * personal average. If their average is > 3 standard deviations faster than
 * the platform median, flags as anomalous.
 */
export function checkVelocityAnomalies(input: VelocityInput): {
    flagged: FlaggedCompletion[];
    medianCompletionTimeHours: number;
} {
    const { postedEvents, approvedEvents, currentTimestamp } = input;
    const flagged: FlaggedCompletion[] = [];

    // Build posted timestamp map
    const postedTimestamps = new Map<number, BountyPostedEvent>();
    for (const e of postedEvents) {
        postedTimestamps.set(e.bountyId, e);
    }

    // Calculate completion times for all approved bounties
    const allCompletionTimes: number[] = [];
    const completionDetails: {
        bountyId: number;
        winner: string;
        protocol: string;
        completionTimeSec: number;
        approvedTimestamp: number;
    }[] = [];

    for (const approval of approvedEvents) {
        const posted = postedTimestamps.get(approval.bountyId);
        if (!posted) continue;

        const completionTime = approval.blockTimestamp - posted.blockTimestamp;
        if (completionTime > 0) {
            allCompletionTimes.push(completionTime);
            completionDetails.push({
                bountyId: approval.bountyId,
                winner: approval.winner.toLowerCase(),
                protocol: posted.protocol.toLowerCase(),
                completionTimeSec: completionTime,
                approvedTimestamp: approval.blockTimestamp,
            });
        }
    }

    if (allCompletionTimes.length < 2) {
        return { flagged, medianCompletionTimeHours: 0 };
    }

    // Calculate median
    const sorted = [...allCompletionTimes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Calculate standard deviation
    const mean = allCompletionTimes.reduce((a, b) => a + b, 0) / allCompletionTimes.length;
    const variance = allCompletionTimes.reduce((sum, t) => sum + (t - mean) ** 2, 0) / allCompletionTimes.length;
    const stdDev = Math.sqrt(variance);

    // Threshold: 3 standard deviations faster than median
    const threshold = median - 3 * stdDev;

    // Group recent completions by contributor
    const recentCompletions = completionDetails.filter(
        (c) => currentTimestamp - c.approvedTimestamp < SEVEN_DAYS_SEC
    );

    const contributorAvgs = new Map<string, number[]>();
    for (const c of recentCompletions) {
        const times = contributorAvgs.get(c.winner) || [];
        times.push(c.completionTimeSec);
        contributorAvgs.set(c.winner, times);
    }

    for (const [contributor, times] of contributorAvgs) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        if (avg < threshold && threshold > 0) {
            for (const c of recentCompletions.filter((rc) => rc.winner === contributor)) {
                const avgH = (avg / 3600).toFixed(1);
                const medH = (median / 3600).toFixed(1);
                const thrH = (threshold / 3600).toFixed(1);
                flagged.push({
                    bountyId: c.bountyId,
                    protocol: c.protocol,
                    winner: c.winner,
                    reason: `Velocity anomaly: avg ${avgH}h vs platform median ${medH}h (threshold: ${thrH}h)`,
                });
            }
        }
    }

    return {
        flagged,
        medianCompletionTimeHours: median / 3600,
    };
}
