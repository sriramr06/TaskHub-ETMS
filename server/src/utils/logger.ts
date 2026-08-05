import winston from 'winston';
import { env } from '@/config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts as string} [${level}]: ${(stack as string) || (message as string)}`;
});

// Hosted platforms (Render, etc.) capture stdout as the log stream and give
// the container an ephemeral filesystem, so writing to local log files there
// is both invisible and pointless — keep those transports for local dev only.
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(colorize(), errors({ stack: true }), timestamp(), logFormat),
  }),
];

if (env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  );
}

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(errors({ stack: true }), timestamp(), logFormat),
  transports,
  exitOnError: false,
});
