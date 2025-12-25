import { PrismaClient } from '@prisma/client';
import { env } from '../config';
import { logger } from '../shared/logger';
import { getPrismaClient } from '../shared/prisma/client';
import { MessageJobService, MessageJobWithUser } from '../modules/jobs/messageJob.service';
import { EmailService } from './email.service';

export class JobWorker {
  private prisma: PrismaClient;
  private jobService: MessageJobService;
  private emailService: EmailService;
  private isRunning = false;

  constructor(prismaClient: PrismaClient = getPrismaClient()) {
    this.prisma = prismaClient;
    this.jobService = new MessageJobService(this.prisma);
    this.emailService = new EmailService();
  }

  async processJob(job: MessageJobWithUser): Promise<void> {
    const message = this.jobService.buildMessage(job);
    try {
      await this.emailService.send(job, message);
      await this.prisma.$transaction(async (tx) => {
        const svc = new MessageJobService(tx);
        await svc.markSent(job.id);
        await svc.scheduleNextForJob(job);
      });
      logger.info(`Job ${job.id} sent for user ${job.userId}`);
    } catch (error: any) {
      const reason = error?.message || 'Unknown error';
      try {
        await this.jobService.markRetry(job.id, job.attempts, reason);
        logger.warn(`Job ${job.id} failed. Scheduled for retry.`, { reason });
      } catch (retryError: any) {
        logger.error(`Job ${job.id} failed and could not be marked for retry.`, {
          originalError: reason,
          retryError: retryError?.message,
        });
      }
    }
  }

  async runOnce(): Promise<number> {
    const jobs = await this.jobService.claimDueJobs(env.WORKER_BATCH_SIZE);
    // Process all claimed jobs in parallel; WORKER_BATCH_SIZE bounds concurrency.
    await Promise.all(jobs.map((job) => this.processJob(job)));
    return jobs.length;
  }

  async start(): Promise<void> {
    this.isRunning = true;
    while (this.isRunning) {
      const processed = await this.runOnce();
      if (processed === 0) {
        await new Promise((resolve) => setTimeout(resolve, env.WORKER_IDLE_MS));
      }
    }
  }

  stop(): void {
    this.isRunning = false;
  }
}
