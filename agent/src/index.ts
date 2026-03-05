import { ethers } from "ethers";
import { v4 as uuidv4 } from "uuid";
import cron from "node-cron";
import { agentConfig } from "./config";
import { ChainReader } from "./services/chainReader";
import { DataHavenService } from "./services/datahaven";
import { OnChainService } from "./services/onchain";
import { checkSelfCompletion } from "./checks/selfCompletion";
import { checkSybilClusters } from "./checks/sybilCluster";
import { checkVelocityAnomalies } from "./checks/velocityAnomaly";
import type { VerificationState, PlatformStats } from "./types";

async function runAgent(): Promise<void> {

    console.log("  DarkEarn Fraud Detection Agent v" + agentConfig.agentVersion);

    console.log(`[Agent] Run started at ${new Date().toISOString()}`);

    const chainReader = new ChainReader(
        agentConfig.rpcUrl,
        agentConfig.contracts.bountyEscrow,
        agentConfig.contracts.reputationNFT,
        agentConfig.contracts.riskParams,
        agentConfig.logsRpcUrl,
    );

    const datahaven = new DataHavenService(
        agentConfig.datahaven.bucketName,
        agentConfig.agentPrivateKey,
    );

    const onchain = new OnChainService(
        agentConfig.rpcUrl,
        agentConfig.agentPrivateKey,
        agentConfig.contracts.riskParams,
    );

    const currentBlock = await chainReader.getCurrentBlock();
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const fromBlock = Math.max(0, currentBlock - agentConfig.blockLookback);
    console.log(`[Agent] Current block: ${currentBlock}, scanning from block ${fromBlock} (last ${agentConfig.blockLookback} blocks)`);

    const [postedEvents, approvedEvents, mintEvents] = await Promise.all([
        chainReader.getBountyPostedEvents(fromBlock),
        chainReader.getWorkApprovedEvents(fromBlock),
        chainReader.getReputationMintedEvents(fromBlock),
    ]);

    console.log(`[Agent] Events: ${postedEvents.length} posted, ${approvedEvents.length} approved, ${mintEvents.length} mints`);


    console.log("\n[Check 1] Self-Completion Detection...");
    const selfResult = await checkSelfCompletion({
        postedEvents,
        approvedEvents,
        chainReader,
    });
    console.log(`  → Flagged: ${selfResult.flagged.length}, Clean: ${selfResult.clean.length}`);

    console.log("[Check 2] Sybil Cluster Detection...");
    const sybilResult = await checkSybilClusters({
        mintEvents,
        chainReader,
        currentTimestamp,
    });
    console.log(`  → Flagged wallets: ${sybilResult.flaggedWallets.length}`);

    console.log("[Check 3] Velocity Anomaly Detection...");
    const velocityResult = checkVelocityAnomalies({
        postedEvents,
        approvedEvents,
        currentTimestamp,
    });
    console.log(`  → Flagged: ${velocityResult.flagged.length}, Median: ${velocityResult.medianCompletionTimeHours.toFixed(1)}h`);


    const allFlaggedCompletions = [
        ...selfResult.flagged,
        ...velocityResult.flagged,
    ];

    const platformStats: PlatformStats = {
        totalBountiesPosted: postedEvents.length,
        totalCompletions: approvedEvents.length,
        medianCompletionTimeHours: velocityResult.medianCompletionTimeHours,
        totalReputationMints: mintEvents.length,
        flaggedCompletionCount: allFlaggedCompletions.length,
        flaggedWalletCount: sybilResult.flaggedWallets.length,
        cleanCompletionCount: selfResult.clean.length,
    };

    const state: VerificationState = {
        runId: uuidv4(),
        timestamp: currentTimestamp,
        blockHeight: currentBlock,
        flaggedCompletions: allFlaggedCompletions,
        flaggedWallets: sybilResult.flaggedWallets,
        cleanCompletions: selfResult.clean,
        platformStats,
        agentVersion: agentConfig.agentVersion,
        signature: "", // will be set after signing
    };

    const stateForSigning = { ...state, signature: "" };
    const stateHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(stateForSigning))
    );
    const signer = new ethers.Wallet(agentConfig.agentPrivateKey);
    state.signature = await signer.signMessage(ethers.getBytes(stateHash));
    console.log(`\n[Agent] State signed by ${signer.address}`);


    const contentHash = await datahaven.uploadVerificationState(state);


    try {
        const txHash = await onchain.updateHash(contentHash);
        console.log(`[Agent] RiskParams updated. TX: ${txHash}`);
    } catch (err: any) {
        console.error(`[Agent] Failed to update RiskParams: ${err.message}`);
    }

    console.log("  AGENT RUN COMPLETE");
    console.log(`  Run ID:          ${state.runId}`);
    console.log(`  Block Height:    ${state.blockHeight}`);
    console.log(`  Flagged:         ${allFlaggedCompletions.length} completions, ${sybilResult.flaggedWallets.length} wallets`);
    console.log(`  Clean:           ${selfResult.clean.length} completions`);
    console.log(`  Content Hash:    ${contentHash}`);

}


const args = process.argv.slice(2);
const isManual = args.includes("--once") || !args.includes("--cron");

if (isManual) {
    console.log("[Agent] Running once (manual/hackathon mode)...\n");
    runAgent()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error("[Agent] Fatal error:", err);
            process.exit(1);
        });
} else {
    console.log(`[Agent] Starting cron schedule: ${agentConfig.cronSchedule}`);
    console.log("[Agent] Running initial check...\n");

    runAgent().catch((err) => console.error("[Agent] Run error:", err));

    cron.schedule(agentConfig.cronSchedule, () => {
        console.log("\n[Agent] Cron triggered, starting run...");
        runAgent().catch((err) => console.error("[Agent] Run error:", err));
    });
}
