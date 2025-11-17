import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { type MidnightProvider, type WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import { type Resource } from '@midnight-ntwrk/wallet';
import { type Wallet } from '@midnight-ntwrk/wallet-api';
import { type Logger } from 'pino';
import * as fs from 'node:fs';
import { type CounterContract, type CounterPrivateState, type CounterProviders, type DeployedCounterContract } from './common-types';
import { type Config } from './config';
/**
 * Create an opaque string value from a plain string
 * This is needed for Opaque<"string"> parameters in Midnight contracts
 */
export declare const createOpaqueString: (value: string) => any;
export declare const getCounterLedgerState: (providers: CounterProviders, contractAddress: ContractAddress) => Promise<bigint | null>;
export declare const counterContractInstance: CounterContract;
export declare const joinContract: (providers: CounterProviders, contractAddress: string) => Promise<DeployedCounterContract>;
export declare const deploy: (providers: CounterProviders, privateState: CounterPrivateState) => Promise<DeployedCounterContract>;
export declare const displayCounterValue: (providers: CounterProviders, counterContract: DeployedCounterContract) => Promise<{
    counterValue: bigint | null;
    contractAddress: string;
}>;
export declare const createWalletAndMidnightProvider: (wallet: Wallet) => Promise<WalletProvider & MidnightProvider>;
export declare const waitForSync: (wallet: Wallet) => Promise<import("@midnight-ntwrk/wallet-api").WalletState>;
export declare const waitForSyncProgress: (wallet: Wallet) => Promise<import("@midnight-ntwrk/wallet-api").WalletState>;
export declare const waitForFunds: (wallet: Wallet) => Promise<bigint>;
export declare const buildWalletAndWaitForFunds: ({ indexer, indexerWS, node, proofServer }: Config, seed: string, filename: string) => Promise<Wallet & Resource>;
export declare const randomBytes: (length: number) => Uint8Array;
export declare const buildFreshWallet: (config: Config) => Promise<Wallet & Resource>;
export declare const configureProviders: (wallet: Wallet & Resource, config: Config) => Promise<{
    privateStateProvider: import("@midnight-ntwrk/midnight-js-types").PrivateStateProvider<"counterPrivateState", any>;
    publicDataProvider: import("@midnight-ntwrk/midnight-js-types").PublicDataProvider;
    zkConfigProvider: NodeZkConfigProvider<"increment">;
    proofProvider: import("@midnight-ntwrk/midnight-js-types").ProofProvider<string>;
    walletProvider: WalletProvider & MidnightProvider;
    midnightProvider: WalletProvider & MidnightProvider;
}>;
export declare function setLogger(_logger: Logger): void;
export declare const streamToString: (stream: fs.ReadStream) => Promise<string>;
export declare const isAnotherChain: (wallet: Wallet, offset: number) => Promise<boolean>;
export declare const saveState: (wallet: Wallet, filename: string) => Promise<void>;
export declare const getItemsSet: (providers: CounterProviders, contractAddress: ContractAddress) => Promise<string[]>;
