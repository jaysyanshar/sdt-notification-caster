// Unit-test bootstrap only.
// IMPORTANT: unit tests must not require a database. Any DB access should be mocked.

// Keep timezone deterministic across OSes.
process.env.TZ = process.env.TZ || 'UTC';

// Default envs used across modules.
process.env.EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'https://email-service.digitalenvision.com.au';
process.env.EMAIL_SERVICE_ENDPOINT = process.env.EMAIL_SERVICE_ENDPOINT || '/send-email';
process.env.EMAIL_TIMEOUT_MS = process.env.EMAIL_TIMEOUT_MS || '2000';
process.env.WORKER_BATCH_SIZE = process.env.WORKER_BATCH_SIZE || '5';
process.env.WORKER_IDLE_MS = process.env.WORKER_IDLE_MS || '0';
process.env.PORT = process.env.PORT || '3000';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';

beforeEach(() => {
  // Ensure HTTP mocks don't leak across unit tests.
  jest.resetModules();
  jest.clearAllMocks();
});

export {};
