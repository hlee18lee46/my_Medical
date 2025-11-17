import { type Interface } from 'node:readline/promises';
import { type Logger } from 'pino';
import { type CounterProviders, type DeployedCounterContract } from './common-types.js';
import { type Config } from './config.js';
/**
 * Simple Enhanced CLI that dynamically adapts to contract functions
 */
export declare class SimpleEnhancedCLI {
    private logger;
    private analyzer;
    private cliGenerator;
    private contractInfo;
    private contract;
    constructor(logger: Logger);
    initialize(): Promise<void>;
    runEnhancedCLI(providers: CounterProviders, rli: Interface): Promise<void>;
    deployOrJoin(providers: CounterProviders, rli: Interface): Promise<DeployedCounterContract | null>;
    run(config: Config, logger: Logger, dockerEnv?: boolean): Promise<void>;
}
export declare const runEnhanced: (config: Config, logger: Logger, dockerEnv?: boolean) => Promise<void>;
export { run as runOriginal } from './cli.js';
