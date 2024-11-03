/**
 * @file logger.ts
 * @description Configures Winston logger for the application.
 */

import { createLogger, format, transports } from 'npm:winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.printf(info => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [new transports.Console()],
});

export default logger; 