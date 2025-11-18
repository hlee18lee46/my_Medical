import { type Logger } from 'pino';
export * from './api.js';
/**
 * Contract information interface
 */
export interface ContractInfo {
    contractName: string;
    functions: Array<{
        name: string;
        parameters: Array<{
            name: string;
            type: string;
        }>;
        returnType: string;
        readOnly: boolean;
        description: string;
    }>;
    ledgerState: Array<{
        name: string;
        type: string;
    }>;
    witnesses: Array<{
        name: string;
        ledgerType: string;
        privateType: string;
        returns: string[];
    }>;
}
/**
 * Enhanced API with dynamic contract analysis
 */
export declare class EnhancedContractAPI {
    private analyzer;
    private cliGenerator;
    private contractInfo;
    constructor(logger: Logger);
    initialize(): Promise<ContractInfo>;
    getContractInfo(): ContractInfo | null;
    generateMenuItems(): any[];
    generateMenuQuestion(menuItems: any[]): string;
    /**
     * Execute update_record function
     */
    update_record(...args: any[]): Promise<any>;
}
export declare const CONTRACT_METADATA: {
    readonly name: "Medical_records Contract";
    readonly fileName: "medical_records.compact";
    readonly generatedAt: "2025-11-17T22:55:58.002Z";
    readonly functions: readonly [{
        readonly name: "update_record";
        readonly parameters: readonly [];
        readonly returnType: "[]";
        readonly readOnly: false;
    }];
    readonly ledgerState: readonly [{
        readonly name: "round";
        readonly type: "Counter";
    }];
    readonly witnesses: readonly [];
};
