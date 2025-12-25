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
  }
}
