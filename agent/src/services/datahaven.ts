import { ethers } from "ethers";
import type { VerificationState } from "../types";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, http, defineChain } from "viem";
import type { WalletClient, Chain } from "viem";
import type { Session } from "@storagehub-sdk/msp-client";


const DATAHAVEN_TESTNET = {
    id: 55931,
    name: "DataHaven Testnet",
    rpcUrl: "https://services.datahaven-testnet.network/testnet",
    wsUrl: "wss://services.datahaven-testnet.network/testnet",
    mspUrl: "https://deo-dh-backend.testnet.datahaven-infra.network/",
    nativeCurrency: { name: "Mock", symbol: "MOCK", decimals: 18 },
};

const chain: Chain = defineChain({
    id: DATAHAVEN_TESTNET.id,
    name: DATAHAVEN_TESTNET.name,
    nativeCurrency: DATAHAVEN_TESTNET.nativeCurrency,
    rpcUrls: { default: { http: [DATAHAVEN_TESTNET.rpcUrl] } },
});

/**
 * DataHaven Storage Service
 *
 * Uploads verification state JSON to DataHaven using the StorageHub SDK v0.5.
 * Uses the namespaced API: mspClient.auth.SIWE, mspClient.files.uploadFile, etc.
 */
export class DataHavenService {
    private bucketName: string;
    private privateKey: string;
    private walletClient: WalletClient | null = null;

    constructor(bucketName: string, privateKey: string) {
        this.bucketName = bucketName;
        this.privateKey = privateKey;
    }

    private async initClients(): Promise<void> {
        if (this.walletClient) return;

        const account = privateKeyToAccount(
            (this.privateKey.startsWith("0x")
                ? this.privateKey
                : `0x${this.privateKey}`) as `0x${string}`
        );

        this.walletClient = createWalletClient({
            chain,
            account,
            transport: http(DATAHAVEN_TESTNET.rpcUrl),
        });

        console.log(
            `[DataHaven] Initialized client for ${account.address}`
        );
    }

    /**
     * Upload verification state to DataHaven.
     * Returns the content hash (bytes32).
     */
    async uploadVerificationState(state: VerificationState): Promise<string> {
        const jsonPayload = JSON.stringify(state, null, 2);
        const contentHash = ethers.keccak256(ethers.toUtf8Bytes(jsonPayload));

        try {
            await this.initClients();

            // Dynamic import for DataHaven SDK
            const { MspClient } = await import("@storagehub-sdk/msp-client");

            // Session state for the sessionProvider callback
            let sessionToken: string | undefined;
            const address = this.walletClient!.account?.address;

            // sessionProvider supplies the JWT to all authenticated requests
            const sessionProvider = async () =>
                sessionToken && address
                    ? ({ token: sessionToken, user: { address } } as Session)
                    : undefined;

            // Connect to MSP with sessionProvider (docs pattern)
            const httpCfg = { baseUrl: DATAHAVEN_TESTNET.mspUrl };
            const mspClient = await MspClient.connect(httpCfg, sessionProvider);

            // Authenticate via SIWE (docs pattern: mspClient.auth.SIWE)
            console.log("[DataHaven] Authenticating via SIWE...");
            const siweSession = await mspClient.auth.SIWE(
                this.walletClient!,
                "localhost",
                "http://localhost"
            );
            sessionToken = siweSession.token;
            console.log("[DataHaven] Authenticated successfully");

            // Upload the JSON payload as a file
            console.log(
                `[DataHaven] Uploading to bucket "${this.bucketName}" (${jsonPayload.length} bytes)...`
            );

            // Find our bucket by listing all buckets for this authenticated user
            const buckets = await mspClient.buckets.listBuckets();
            const bucket = buckets.find((b) => b.name === this.bucketName);
            if (!bucket) {
                console.warn(
                    `[DataHaven] Bucket "${this.bucketName}" not found. ` +
                    `Available: ${buckets.map((b) => b.name).join(", ") || "(none)"}. ` +
                    `Using local hash only.`
                );
            } else {
                // Convert JSON payload to Uint8Array for upload
                const encoder = new TextEncoder();
                const fileData = encoder.encode(jsonPayload);
                const fileName = `verification-${state.timestamp}.json`;

                // Upload using docs pattern: mspClient.files.uploadFile
                // uploadFile(bucketId, fileKey, file, fingerprint, owner, location, options?)
                const uploadReceipt = await mspClient.files.uploadFile(
                    bucket.bucketId,
                    contentHash as `0x${string}`,   // file key
                    fileData,                        // file data
                    contentHash as `0x${string}`,   // fingerprint
                    address! as `0x${string}`,      // owner
                    fileName,                        // location
                );

                console.log(`[DataHaven] Upload receipt:`, uploadReceipt);
                if (uploadReceipt.status !== "upload_successful") {
                    console.warn(`[DataHaven] Upload status: ${uploadReceipt.status}`);
                }
            }

            console.log(`[DataHaven] Content hash: ${contentHash}`);
        } catch (err: any) {
            console.warn(
                `[DataHaven] SDK upload failed (${err.message}), using local hash`
            );
            console.log(
                `[DataHaven] Content hash (local): ${contentHash}`
            );
        }

        return contentHash;
    }
}
