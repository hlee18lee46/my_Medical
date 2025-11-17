import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
declare const Ledger: any;
export type CounterPrivateState = {
    readonly secretKey: Uint8Array;
};
export declare const createCounterPrivateState: (secretKey: Uint8Array) => {
    secretKey: Uint8Array<ArrayBufferLike>;
};
export declare const witnesses: {
    secretKey: ({ privateState }: WitnessContext<typeof Ledger, CounterPrivateState>) => [CounterPrivateState, Uint8Array];
};
export {};
