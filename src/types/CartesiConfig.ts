

export interface CartesiConfig {
  inspectURL: string;
  graphqlURL: string;
  report: {
    maxRetry: number
    baseDelay: number
  }
}
