import { type ILogger } from '../../types/Logger';
import { createLogger, format, type Logger as LoggerWiston } from 'winston';
export class Logger implements ILogger {
  private readonly logger: LoggerWiston;
  public constructor() {
    this.logger = createLogger({
      format: format.json(),
    });
  }
  public error(...args: unknown[]): void {
    this.logger.error(args);
  }
  public info(...args: unknown[]): void {
    this.logger.info(args);
  }
  public debug(...args: unknown[]): void {
    this.logger.debug(args);
  }
}

export default new Logger();
