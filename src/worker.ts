import { validateEnv } from './config';
import { logger } from './shared/logger';
import { JobWorker } from './worker/jobWorker';

validateEnv();

const worker = new JobWorker();

logger.info('Starting worker.');

worker
  .start()
  .catch((err) => {
    logger.error('Worker failed to start', err);
    process.exit(1);
  });

process.on('SIGINT', () => {
  logger.info('SIGINT received. Stopping worker.');
  worker.stop();
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Stopping worker.');
  worker.stop();
});
