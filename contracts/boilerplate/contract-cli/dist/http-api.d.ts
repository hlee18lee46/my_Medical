/**
 * Call the medical_records.update_record(patient_hash, encrypted_hash) circuit
 * using the existing Midnight config.
 *
 * Env vars required:
 *   MEDICAL_WALLET_SEED      - 64-hex seed of the wallet that has tDUST
 *   MEDICAL_CONTRACT_ADDRESS - deployed contract address (0200...)
 */
export declare function updateMedicalRecordOnChain(patient_hash: bigint, encrypted_hash: bigint): Promise<{
    txId: string;
    blockHeight: bigint;
    contractAddress: string;
}>;
