import pino from "pino";
import { buildWalletAndWaitForFunds, configureProviders, joinContract, setLogger, } from "./api.js";
import { contractConfig } from "./config.js";
// Simple pino logger (same style as CLI)
const logger = pino({ level: "info", name: "http-api" });
setLogger(logger);
// --- Helpers to build wallet + providers ---
// NOTE: use `any` here so we don't fight the Config typing
async function buildWalletWithSeed(seed, filename) {
    // contractConfig already has the full Config shape
    return await buildWalletAndWaitForFunds(contractConfig, seed, filename);
}
async function getProviders(seed) {
    const wallet = await buildWalletWithSeed(seed, "medical-http-wallet.json");
    return await configureProviders(wallet, contractConfig);
}
async function getContract(providers, contractAddress) {
    // Re-use the existing joinContract helper
    return await joinContract(providers, contractAddress);
}
/**
 * Call the medical_records.update_record(patient_hash, encrypted_hash) circuit
 * using the existing Midnight config.
 *
 * Env vars required:
 *   MEDICAL_WALLET_SEED      - 64-hex seed of the wallet that has tDUST
 *   MEDICAL_CONTRACT_ADDRESS - deployed contract address (0200...)
 */
export async function updateMedicalRecordOnChain(patient_hash, encrypted_hash) {
    const seed = process.env.MEDICAL_WALLET_SEED;
    const contractAddress = process.env.MEDICAL_CONTRACT_ADDRESS;
    if (!seed) {
        throw new Error("MEDICAL_WALLET_SEED is not set in environment");
    }
    if (!contractAddress) {
        throw new Error("MEDICAL_CONTRACT_ADDRESS is not set in environment");
    }
    logger.info({ contractAddress }, "Preparing to call update_record on contract");
    const providers = await getProviders(seed);
    const contract = await getContract(providers, contractAddress);
    // Call the state-changing function just like the CLI does
    const result = await contract.callTx.update_record(patient_hash, encrypted_hash);
    logger.info({
        txId: result.public.txId,
        blockHeight: result.public.blockHeight,
    }, "update_record transaction submitted");
    return {
        txId: result.public.txId,
        blockHeight: result.public.blockHeight,
        contractAddress,
    };
}
//# sourceMappingURL=http-api.js.map