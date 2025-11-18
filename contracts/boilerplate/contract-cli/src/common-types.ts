// boilerplate/contract-cli/src/common-types.ts

import { contracts } from '@midnight-ntwrk/contract';
import type {
  ImpureCircuitId,
  MidnightProviders,
} from '@midnight-ntwrk/midnight-js-types';
import type {
  DeployedContract,
  FoundContract,
} from '@midnight-ntwrk/midnight-js-contracts';

// Dynamically pick the compiled contract (medical_records)
export const getContractModule = () => {
  const contractNames = Object.keys(contracts);
  if (contractNames.length === 0) {
    throw new Error('No contract found in contracts object');
  }
  return contracts[contractNames[0]];
};

export const contractModule = getContractModule();

// This is your Compact contract type
export type CounterContract = typeof contractModule.Contract;

// We don’t really use private state for medical_records;
// keep it generic so types don’t fight us.
export type CounterPrivateState = unknown;

// Just a string ID used by MidnightProviders generic
export const CounterPrivateStateId = 'counterPrivateState' as const;

export type CounterCircuits = ImpureCircuitId<typeof contractModule.Contract>;

export type CounterProviders = MidnightProviders<
  CounterCircuits,
  typeof CounterPrivateStateId,
  CounterPrivateState
>;

export type DeployedCounterContract =
  | DeployedContract<CounterContract>
  | FoundContract<CounterContract>;