import axios, { AxiosInstance } from 'axios';
import { MessageJobWithUser } from '../modules/jobs/messageJob.service';
import { env } from '../config';

export class EmailService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.EMAIL_SERVICE_URL,
      timeout: env.EMAIL_TIMEOUT_MS,
    });
  }

  async send(job: MessageJobWithUser, message: string): Promise<void> {
    try {
      await this.client.post(
        env.EMAIL_SERVICE_ENDPOINT,
        {
          email: job.user.email,
          message,
        },
        {
          headers: {
            'Idempotency-Key': job.id,
          },
        }
      );
    } catch (error: unknown) {
      // Distinguish between permanent (4xx) and transient errors (5xx, network, timeouts).
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        // Treat 4xx client errors as permanent failures that should not be retried.
        if (status !== undefined && status >= 400 && status < 500 && status !== 408) {
          // Optionally log or record the permanent failure here.
          throw error;
        }
      }

      // Re-throw transient or unknown errors so that upstream retry logic can handle them.
      throw error;
    }
  }
}
