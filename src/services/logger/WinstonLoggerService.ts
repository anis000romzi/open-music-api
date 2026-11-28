import {
  createLogger,
  format,
  transports,
  Logger,
} from 'winston';
import { ILoggerService } from '../interfaces/ILoggerService';

const {
  combine,
  timestamp,
  printf,
  colorize,
} = format;

const logFormat = printf(({ level, message, timestamp: ts }) => (
  `${ts} [${level}]: ${message}`
));

export class WinstonLoggerService implements ILoggerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
      transports: [
        new transports.Console({
          format: combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            logFormat,
          ),
        }),
        new transports.File({ filename: 'logs/error.log', level: 'error' }),
        new transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  log(message: string): void {
    this.logger.info(message);
  }

  info(message: string): void {
    this.logger.info(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  error(message: string): void {
    this.logger.error(message);
  }

  debug(message: string): void {
    this.logger.debug(message);
  }
}
