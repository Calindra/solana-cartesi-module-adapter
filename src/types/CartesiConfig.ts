

export interface CartesiConfig {
  inspectURL: string;
  graphqlURL: string;

  /**
   * Cartesi Rollups contract address
   */
  contractAddress: string;
  report: {
    maxRetry: number;
    baseDelay: number;
  }
}
