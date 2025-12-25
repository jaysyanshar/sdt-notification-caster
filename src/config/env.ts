import { config } from 'dotenv';

config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  DATABASE_URL: process.env.DATABASE_URL || '',
  WORKER_BATCH_SIZE: parseInt(process.env.WORKER_BATCH_SIZE || '10', 10),
  WORKER_IDLE_MS: parseInt(process.env.WORKER_IDLE_MS || '30000', 10),
  EMAIL_SERVICE_URL: process.env.EMAIL_SERVICE_URL || 'https://email-service.digitalenvision.com.au',
  EMAIL_SERVICE_ENDPOINT: process.env.EMAIL_SERVICE_ENDPOINT || '/send-email',
  EMAIL_TIMEOUT_MS: parseInt(process.env.EMAIL_TIMEOUT_MS || '5000', 10),
} as const;

export function validateEnv(): void {
  const requiredEnvVars: string[] = ['DATABASE_URL'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  if (Number.isNaN(env.PORT) || env.PORT <= 0) {
    throw new Error('PORT must be a positive integer');
  }

  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be provided');
  }

  if (Number.isNaN(env.WORKER_BATCH_SIZE) || env.WORKER_BATCH_SIZE <= 0) {
    throw new Error('WORKER_BATCH_SIZE must be a positive integer');
  }

  if (Number.isNaN(env.WORKER_IDLE_MS) || env.WORKER_IDLE_MS < 0) {
    throw new Error('WORKER_IDLE_MS must be a non-negative integer');
  }

  if (Number.isNaN(env.EMAIL_TIMEOUT_MS) || env.EMAIL_TIMEOUT_MS <= 0) {
    throw new Error('EMAIL_TIMEOUT_MS must be a positive integer');
  }
}
