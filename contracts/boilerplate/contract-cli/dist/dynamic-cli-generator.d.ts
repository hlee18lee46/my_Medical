import { type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { type CounterProviders, type DeployedCounterContract } from './common-types.js';
export interface MenuItem {
    id: string;
    label: string;
    description: string;
    action: (providers: CounterProviders, contract: DeployedCounterContract, rli: Interface) => Promise<void>;
    isReadOnly: boolean;
}
/**
 * Dynamically generates CLI menus and handlers based on contract analysis
 */
export declare class DynamicCLIGenerator {
    private analyzer;
    private logger;
    private contractAnalysis;
    constructor(logger: Logger);
    /**
     * Initialize the CLI generator by analyzing the contract
     */
    initialize(): Promise<void>;
    /**
     * Generate menu items based on contract functions
     */
    generateMenuItems(): MenuItem[];
    /**
     * Generate the main menu question text
     */
    generateMenuQuestion(menuItems: MenuItem[]): string;
    /**
     * Create a function handler for a specific contract function
     */
    private createFunctionHandler;
    /**
     * Create a handler for displaying contract state
     */
    private createStateDisplayHandler;
    /**
     * Collect a parameter value from user input
     */
    private collectParameter;
    /**
     * Handle special parameter collection (e.g., voting options)
     */
    private collectSpecialParameter;
    /**
     * Execute a read-only function and display results
     */
    private executeReadOnlyFunction;
    /**
     * Execute a state-changing function
     */
    private executeStateChangingFunction;
    /**
     * Format function name for display
     */
    private formatFunctionLabel;
}
