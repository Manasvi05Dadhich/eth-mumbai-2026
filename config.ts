import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

const addressesPath = path.resolve(__dirname, "addresses.json");
const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));

export const config = {
  // Chain
  rpcUrl: process.env.BASE_SEPOLIA_RPC!,
  deployerPrivateKey: process.env.DEPLOYER_PRIVATE_KEY!,
  chainId: 84532, // Base Sepolia

  // Deployed contract addresses (filled after deploy)
  contracts: {
    reputationVerifier: addresses.ReputationVerifier as string,
    skillVerifier: addresses.SkillVerifier as string,
    bountyEscrow: addresses.BountyEscrow as string,
    reputationNFT: addresses.ReputationNFT as string,
    skillRegistry: addresses.SkillRegistry as string,
  },

  // BitGo
  bitgoApiKey: process.env.BITGO_API_KEY ?? "",
  bitgoWalletId: process.env.BITGO_WALLET_ID ?? "",

  // DataHaven / StorageHub
  datahavenApiKey: process.env.DATAHAVEN_API_KEY ?? "",
} as const;

export type Config = typeof config;
