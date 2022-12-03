

export interface Config {
    inspectURL: string;
    graphqlURL: string;

    report: {
        maxRetry: number
        baseDelay: number
    }
}
