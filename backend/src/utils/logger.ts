import pino, { type LoggerOptions } from 'pino';
import { env } from '../config/env.js';

/** Session cookies and passwords must never reach the logs. */
export const REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.currentPassword',
  'req.body.newPassword',
  '*.password',
  '*.currentPassword',
  '*.newPassword',
  '*.refreshToken',
  '*.accessToken',
];

export const baseLoggerOptions: LoggerOptions = {
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
};

const logger = pino({
  ...baseLoggerOptions,
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

export default logger;
