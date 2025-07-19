const { createLogger, format, transports } = require('winston');

const {
  combine,
  timestamp,
  printf,
  colorize,
} = format;

// eslint-disable-next-line no-shadow
const logFormat = printf(({ level, message, timestamp }) => `${timestamp} [${level}]: ${message}`);

class LoggerService {
  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat,
      ),
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

  log(message) {
    this.logger.info(message);
  }

  info(message) {
    this.logger.info(message);
  }

  warn(message) {
    this.logger.warn(message);
  }

  error(message) {
    this.logger.error(message);
  }

  debug(message) {
    this.logger.debug(message);
  }
}

module.exports = LoggerService;
