import { ethers } from "ethers";

const RISK_PARAMS_ABI = [
    "function updateHash(bytes32 newHash) external",
    "function getHash() view returns (bytes32)",
    "function isStale() view returns (bool)",
    "function getLastUpdated() view returns (uint256)",
];

/**
 * On-chain service for calling RiskParams.updateHash()
 */
export class OnChainService {
    private signer: ethers.Wallet;
    private riskParams: ethers.Contract;

    constructor(rpcUrl: string, privateKey: string, riskParamsAddr: string) {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        this.signer = new ethers.Wallet(privateKey, provider);
        this.riskParams = new ethers.Contract(riskParamsAddr, RISK_PARAMS_ABI, this.signer);
    }

    /**
     * Update the RiskParams hash on-chain with the DataHaven content hash.
     */
    async updateHash(contentHash: string): Promise<string> {
        console.log(`[OnChain] Updating RiskParams hash to: ${contentHash}`);
        console.log(`[OnChain] Agent address: ${this.signer.address}`);

        const tx = await this.riskParams.updateHash(contentHash);
        console.log(`[OnChain] Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`[OnChain] Confirmed in block ${receipt.blockNumber}`);

        return tx.hash;
    }

    /**
     * Check current state of RiskParams.
     */
    async getStatus(): Promise<{ hash: string; isStale: boolean; lastUpdated: number }> {
        const [hash, isStale, lastUpdated] = await Promise.all([
            this.riskParams.getHash(),
            this.riskParams.isStale(),
            this.riskParams.getLastUpdated(),
        ]);
        return {
            hash: hash as string,
            isStale: isStale as boolean,
            lastUpdated: Number(lastUpdated),
        };
    }

    getSignerAddress(): string {
        return this.signer.address;
    }
}
