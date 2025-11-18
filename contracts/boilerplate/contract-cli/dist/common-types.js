// boilerplate/contract-cli/src/common-types.ts
import { contracts } from '@midnight-ntwrk/contract';
// Dynamically pick the compiled contract (medical_records)
export const getContractModule = () => {
    const contractNames = Object.keys(contracts);
    if (contractNames.length === 0) {
        throw new Error('No contract found in contracts object');
    }
    return contracts[contractNames[0]];
};
export const contractModule = getContractModule();
// Just a string ID used by MidnightProviders generic
export const CounterPrivateStateId = 'counterPrivateState';
//# sourceMappingURL=common-types.js.map