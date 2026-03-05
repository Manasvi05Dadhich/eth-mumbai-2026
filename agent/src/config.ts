import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const addressesPath = path.resolve(__dirname, "../../addresses.json");
let addresses: Record<string, string> = {};
try {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
} catch {
    console.warn("addresses.json not found, using empty addresses");
}

export const agentConfig = {
    rpcUrl: process.env.BASE_SEPOLIA_RPC ?? "https://base-sepolia.g.alchemy.com/v2/demo",
    // Public Base Sepolia RPC for eth_getLogs — no Alchemy free-tier block range restriction
    logsRpcUrl: process.env.BASE_SEPOLIA_LOGS_RPC ?? "https://sepolia.base.org",
    agentPrivateKey: process.env.DEPLOYER_PRIVATE_KEY ?? "",
    chainId: 84532,
    // How many recent blocks to scan for events (Base Sepolia ~2s blocks, 5000 ≈ last ~3 hours)
    blockLookback: Number(process.env.BLOCK_LOOKBACK ?? "5000"),

    contracts: {
        bountyEscrow: addresses.BountyEscrow ?? "",
        reputationNFT: addresses.ReputationNFT ?? "",
        riskParams: addresses.RiskParams ?? "",
    },

    datahaven: {
        bucketName: "darkearn-fraud-state",
    },

    agentVersion: "1.0.0",
    cronSchedule: "*/15 * * * *", // every 15 minutes
} as const;
