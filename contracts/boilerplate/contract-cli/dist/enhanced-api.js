// Enhanced API wrapper for Medical_records Contract
// Generated on: 2025-11-17T22:55:58.002Z
// Auto-generated from medical_records.compact
import { ContractAnalyzer } from './contract-analyzer.js';
import { DynamicCLIGenerator } from './dynamic-cli-generator.js';
import * as originalApi from './api.js';
// Re-export all original API functions
export * from './api.js';
/**
 * Enhanced API with dynamic contract analysis
 */
export class EnhancedContractAPI {
    analyzer;
    cliGenerator;
    contractInfo;
    constructor(logger) {
        this.analyzer = new ContractAnalyzer();
        this.cliGenerator = new DynamicCLIGenerator(logger);
        this.contractInfo = null;
    }
    async initialize() {
        try {
            const analysis = await this.analyzer.analyzeContract();
            await this.cliGenerator.initialize();
            // Convert ContractAnalysis to ContractInfo format
            this.contractInfo = {
                contractName: analysis.contractName,
                functions: analysis.functions.map(func => ({
                    ...func,
                    readOnly: this.analyzer.isReadOnlyFunction(func.name),
                    description: func.description || `Execute ${func.name} function`
                })),
                ledgerState: Object.entries(analysis.ledgerState).map(([name, type]) => ({ name, type })),
                witnesses: analysis.witnesses.map(witness => ({
                    name: witness.name,
                    ledgerType: witness.ledgerType,
                    privateType: witness.privateType,
                    returns: witness.returns
                }))
            };
            return this.contractInfo;
        }
        catch (error) {
            throw new Error(`Failed to initialize enhanced API: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    getContractInfo() {
        return this.contractInfo;
    }
    generateMenuItems() {
        return this.cliGenerator.generateMenuItems();
    }
    generateMenuQuestion(menuItems) {
        return this.cliGenerator.generateMenuQuestion(menuItems);
    }
    // Dynamic function mapping based on contract analysis
    /**
     * Execute update_record function
     */
    async update_record(...args) {
        return await originalApi.update_record(...args);
    }
}
// Export contract metadata for reference
export const CONTRACT_METADATA = {
    name: 'Medical_records Contract',
    fileName: 'medical_records.compact',
    generatedAt: '2025-11-17T22:55:58.002Z',
    functions: [
        {
            "name": "update_record",
            "parameters": [],
            "returnType": "[]",
            "readOnly": false
        }
    ],
    ledgerState: [
        {
            "name": "round",
            "type": "Counter"
        }
    ],
    witnesses: []
};
//# sourceMappingURL=enhanced-api.js.map