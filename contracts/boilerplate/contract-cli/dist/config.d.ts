export declare const currentDir: string;
export declare const contractConfig: {
    privateStateStoreName: string;
    zkConfigPath: string;
};
export interface Config {
    readonly logDir: string;
    readonly indexer: string;
    readonly indexerWS: string;
    readonly node: string;
    readonly proofServer: string;
}
export declare class TestnetLocalConfig implements Config {
    logDir: string;
    indexer: string;
    indexerWS: string;
    node: string;
    proofServer: string;
    constructor();
}
export declare class StandaloneConfig implements Config {
    logDir: string;
    indexer: string;
    indexerWS: string;
    node: string;
    proofServer: string;
    constructor();
}
export declare class TestnetRemoteConfig implements Config {
    logDir: string;
    indexer: string;
    indexerWS: string;
    node: string;
    proofServer: string;
    constructor();
}
