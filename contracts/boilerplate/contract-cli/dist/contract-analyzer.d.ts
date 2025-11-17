export interface ContractFunction {
    name: string;
    parameters: Array<{
        name: string;
        type: string;
    }>;
    returnType: string;
    description?: string;
}
export interface ContractWitness {
    name: string;
    ledgerType: string;
    privateType: string;
    returns: string[];
}
export interface ContractAnalysis {
    contractName: string;
    functions: ContractFunction[];
    ledgerState: {
        [key: string]: string;
    };
    witnesses: ContractWitness[];
}
/**
 * Analyzes the contract to extract function signatures and information
 */
export declare class ContractAnalyzer {
    private contractPath;
    private typesPath;
    private contractAnalysis;
    constructor();
    /**
     * Auto-detect the contract name from the actual .compact file in source directory
     * This ensures we always use the current contract file, not old managed directories
     */
    private detectContractFromSource;
    /**
     * Analyze the contract and return all info, including witnesses
     */
    analyzeContract(): Promise<ContractAnalysis>;
    /**
     * Parse function signatures from TypeScript definitions
     */
    private parseFunctions;
    /**
     * Parse impure function signatures (state-modifying functions)
     */
    private parseFunctionSignatures;
    /**
     * Parse pure function signatures (read-only functions)
     */
    private parsePureFunctionSignatures;
    /**
     * Parse ledger state structure from TypeScript definitions
     */
    private parseLedgerState;
    /**
     * Map TypeScript types to user-friendly names
     */
    private mapTypeScriptTypeToUserFriendly;
    private generateFunctionDescription;
    /**
     * Check if a function is a read-only function (doesn't modify state)
     */
    isReadOnlyFunction(functionName: string): boolean;
    /**
     * Check if a function requires special parameter handling
     */
    requiresSpecialHandling(paramName: string): boolean;
}
