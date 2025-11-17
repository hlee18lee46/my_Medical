import { contracts } from '@midnight-ntwrk/contract';
// Get the dynamic contract module
const getContractModule = () => {
    const contractNames = Object.keys(contracts);
    if (contractNames.length === 0) {
        throw new Error('No contract found in contracts object');
    }
    return contracts[contractNames[0]];
};
const contractModule = getContractModule();
export const CounterPrivateStateId = 'counterPrivateState';
//# sourceMappingURL=common-types.js.map