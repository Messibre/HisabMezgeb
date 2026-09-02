import { Server } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import logger from './utils/logger.js';

let server: Server;

let isShuttingDown = false;
let cleanupStarted = false;

const handleShutdown = async (signal: string) => {
  if (isShuttingDown) {
    logger.warn(`Received ${signal} again — shutdown already in progress, ignoring.`);
    return;
  }
  isShuttingDown = true;

  logger.warn(`Received ${signal}. Starting graceful shutdown pipeline...`);

  const cleanupAndExit = async (exitCode: number): Promise<void> => {
    if (cleanupStarted) {
      logger.warn('Cleanup already in progress/completed — ignoring duplicate call.');
      return;
    }
    cleanupStarted = true;

    clearTimeout(forceExitTimer);

    let finalExitCode = exitCode;
    try {
      await prisma.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (err) {
      logger.error(err, 'Database disconnect failed');
      finalExitCode = 1;
    } finally {
      process.exit(finalExitCode);
    }
  };

  const forceExitTimer = setTimeout(() => {
    logger.fatal('Graceful shutdown exceeded 10s. Forcing emergency cleanup...');
    if (server) {
      try {
        server.closeAllConnections();
      } catch (err) {
        logger.error(err, 'Failed to force-close remaining connections');
      }
    }
    void cleanupAndExit(1);
  }, 10_000);
  forceExitTimer.unref();

  if (!server) {
    await cleanupAndExit(0);
    return;
  }

  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }

  server.close(async (err) => {
    if (err) {
      logger.error(err, 'Error closing HTTP server');
      await cleanupAndExit(1);
      return;
    }
    logger.info('HTTP server closed — no longer accepting connections');
    await cleanupAndExit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal(err, 'Uncaught exception — initiating shutdown');
  void handleShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.fatal(reason, 'Unhandled promise rejection — initiating shutdown');
  void handleShutdown('unhandledRejection');
});

const startServer = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connections established successfully');

    server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.fatal(error, 'Failed to initialize system core startup layers');
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
