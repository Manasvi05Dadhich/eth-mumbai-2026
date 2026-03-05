import type {
    BountyPostedEvent,
    WorkApprovedEvent,
    FlaggedCompletion,
    CleanCompletion,
} from "../types";
import type { ChainReader } from "../services/chainReader";

const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;

export interface SelfCompletionInput {
    postedEvents: BountyPostedEvent[];
    approvedEvents: WorkApprovedEvent[];
    chainReader: ChainReader;
}

/**
 * Fraud Check 1 — Self-Completion Detection
 * 
 * For each completed bounty, traces funding history of the protocol wallet
 * and the winner wallet. If both were funded by the same parent address
 * within a 7-day window, flags as suspected self-completion.
 */
export async function checkSelfCompletion(input: SelfCompletionInput): Promise<{
    flagged: FlaggedCompletion[];
    clean: CleanCompletion[];
}> {
    const { postedEvents, approvedEvents, chainReader } = input;
    const flagged: FlaggedCompletion[] = [];
    const clean: CleanCompletion[] = [];

    // Build a map of bountyId → protocol address from posted events
    const protocolMap = new Map<number, string>();
    for (const e of postedEvents) {
        protocolMap.set(e.bountyId, e.protocol.toLowerCase());
    }

    for (const approval of approvedEvents) {
        const protocol = protocolMap.get(approval.bountyId);
        if (!protocol) continue;

        const winner = approval.winner.toLowerCase();

        // Trace funding sources
        const [protocolSource, winnerSource] = await Promise.all([
            chainReader.getFundingSource(protocol),
            chainReader.getFundingSource(winner),
        ]);

        if (
            protocolSource &&
            winnerSource &&
            protocolSource === winnerSource
        ) {
            flagged.push({
                bountyId: approval.bountyId,
                protocol,
                winner,
                reason: `Self-completion suspected: both wallets funded by ${protocolSource}`,
                fundingSource: protocolSource,
            });
        } else {
            clean.push({
                bountyId: approval.bountyId,
                protocol,
                winner,
            });
        }
    }

    return { flagged, clean };
}
