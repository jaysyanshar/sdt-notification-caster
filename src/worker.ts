import { validateEnv } from './config';
import { logger } from './shared/logger';
import { JobWorker } from './worker/jobWorker';

validateEnv();

const worker = new JobWorker();

let isShuttingDown = false;

logger.info('Starting worker.');

worker
  .start()
  .catch((err) => {
    logger.error('Worker failed to start', err);
    process.exit(1);
  });

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  
  try {
    logger.info(`${signal} received. Stopping worker.`);
    await worker.stop();
    logger.info('Worker stopped gracefully.');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT').catch((err) => {
    logger.error('Unexpected error during SIGINT shutdown', err);
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM').catch((err) => {
    logger.error('Unexpected error during SIGTERM shutdown', err);
    process.exit(1);
  });
});
