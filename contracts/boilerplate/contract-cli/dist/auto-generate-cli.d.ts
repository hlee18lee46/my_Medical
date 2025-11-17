declare class CLIAutoGenerator {
    private analyzer;
    private outputDir;
    constructor();
    generate(): Promise<void>;
    /**
     * Generate API wrapper functions for better type safety and documentation
     */
    private generateAPIWrappers;
    /**
     * Generate the content for API wrapper file
     */
    private generateAPIWrapperContent;
    /**
     * Generate a wrapper function for a contract function
     */
    private generateFunctionWrapper;
    private mapToTypeScriptType;
}
export { CLIAutoGenerator };
