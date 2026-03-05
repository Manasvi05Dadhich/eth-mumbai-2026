import { ethers } from "ethers";
import type {
    BountyPostedEvent,
    WorkApprovedEvent,
    ReputationMintedEvent,
    AssetTransfer,
} from "../types";

// ─── ABI Fragments ─────────────────────────────────────────────
const BOUNTY_ESCROW_ABI = [
    "event BountyPosted(uint256 indexed bountyId, address indexed protocol, uint256 categoryId, uint256 deadline)",
    "event WorkApproved(uint256 indexed bountyId, address indexed winner)",
    "function bounties(uint256) view returns (address protocol, bytes32 titleHash, bytes32 descriptionHash, uint256 categoryId, uint256 minScoreBand, uint256 minSkillCompletions, uint256 deadline, bytes encryptedPrize, bytes32 bitgoWalletId, uint8 status, address winner)",
];

const REPUTATION_NFT_ABI = [
    "event ReputationMinted(address indexed to, uint256 indexed tokenId, bytes32 ensNode, uint256 scoreBand)",
];

const RISK_PARAMS_ABI = [
    "function updateHash(bytes32 newHash) external",
    "function getHash() view returns (bytes32)",
    "function isStale() view returns (bool)",
];

// ─── Chain Reader ──────────────────────────────────────────────
export class ChainReader {
    public provider: ethers.JsonRpcProvider;
    public logsProvider: ethers.JsonRpcProvider; // public RPC, no block-range limits
    public bountyEscrow: ethers.Contract;
    public reputationNFT: ethers.Contract;
    public riskParams: ethers.Contract;

    constructor(
        rpcUrl: string,
        bountyEscrowAddr: string,
        reputationNFTAddr: string,
        riskParamsAddr: string,
        logsRpcUrl?: string,
    ) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        // Use a separate provider for eth_getLogs to bypass Alchemy free-tier limits
        this.logsProvider = new ethers.JsonRpcProvider(logsRpcUrl ?? rpcUrl);
        this.bountyEscrow = new ethers.Contract(bountyEscrowAddr, BOUNTY_ESCROW_ABI, this.logsProvider);
        this.reputationNFT = new ethers.Contract(reputationNFTAddr, REPUTATION_NFT_ABI, this.logsProvider);
        this.riskParams = new ethers.Contract(riskParamsAddr, RISK_PARAMS_ABI, this.provider);
    }

    async getCurrentBlock(): Promise<number> {
        return this.provider.getBlockNumber();
    }

    async getBountyPostedEvents(fromBlock: number = 0): Promise<BountyPostedEvent[]> {
        const filter = this.bountyEscrow.filters.BountyPosted();
        const logs = await this.bountyEscrow.queryFilter(filter, fromBlock);
        const results: BountyPostedEvent[] = [];

        for (const log of logs) {
            const event = log as ethers.EventLog;
            const block = await event.getBlock();
            results.push({
                bountyId: Number(event.args[0]),
                protocol: event.args[1] as string,
                categoryId: Number(event.args[2]),
                deadline: Number(event.args[3]),
                blockTimestamp: block.timestamp,
            });
        }
        return results;
    }

    async getWorkApprovedEvents(fromBlock: number = 0): Promise<WorkApprovedEvent[]> {
        const filter = this.bountyEscrow.filters.WorkApproved();
        const logs = await this.bountyEscrow.queryFilter(filter, fromBlock);
        const results: WorkApprovedEvent[] = [];

        for (const log of logs) {
            const event = log as ethers.EventLog;
            const block = await event.getBlock();
            results.push({
                bountyId: Number(event.args[0]),
                winner: event.args[1] as string,
                blockTimestamp: block.timestamp,
            });
        }
        return results;
    }

    async getReputationMintedEvents(fromBlock: number = 0): Promise<ReputationMintedEvent[]> {
        const filter = this.reputationNFT.filters.ReputationMinted();
        const logs = await this.reputationNFT.queryFilter(filter, fromBlock);
        const results: ReputationMintedEvent[] = [];

        for (const log of logs) {
            const event = log as ethers.EventLog;
            const block = await event.getBlock();
            results.push({
                to: event.args[0] as string,
                tokenId: Number(event.args[1]),
                ensNode: event.args[2] as string,
                scoreBand: Number(event.args[3]),
                blockTimestamp: block.timestamp,
                txHash: event.transactionHash,
            });
        }
        return results;
    }

    async getIncomingTransfers(address: string): Promise<AssetTransfer[]> {
        try {
            const result = await this.provider.send("alchemy_getAssetTransfers", [{
                fromBlock: "0x0",
                toAddress: address,
                category: ["external"],
                order: "asc",
                maxCount: "0x14",
            }]);

            return (result.transfers || []).map((t: any) => ({
                from: t.from as string,
                to: t.to as string,
                value: t.value ?? 0,
                blockNum: t.blockNum as string,
                hash: t.hash as string,
            }));
        } catch {
            return [];
        }
    }

    async getFundingSource(address: string): Promise<string | null> {
        const transfers = await this.getIncomingTransfers(address);
        if (transfers.length === 0) return null;
        return transfers[0].from.toLowerCase();
    }

    async getWalletFirstTxTimestamp(address: string): Promise<number | null> {
        const transfers = await this.getIncomingTransfers(address);
        if (transfers.length === 0) return null;
        const blockNum = parseInt(transfers[0].blockNum, 16);
        const block = await this.provider.getBlock(blockNum);
        return block?.timestamp ?? null;
    }
}

export { RISK_PARAMS_ABI };
