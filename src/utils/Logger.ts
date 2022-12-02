import { type ILogger } from '../types/Logger';

export function createLogger(): ILogger {
  return console;
}

const defaultLogger = createLogger();

export default defaultLogger;
