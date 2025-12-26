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
  private shutdownPromise: Promise<void> | null = null;
  private shutdownResolve: (() => void) | null = null;

  constructor(prismaClient: PrismaClient = getPrismaClient()) {
    this.prisma = prismaClient;
    this.jobService = new MessageJobService(this.prisma);
    this.emailService = new EmailService();
  }

  async processJob(job: MessageJobWithUser): Promise<void> {
    const message = this.jobService.buildMessage(job);
    let emailSent = false;
    
    try {
      await this.emailService.send(job, message);
      emailSent = true;
      
      await this.prisma.$transaction(async (tx) => {
        const svc = new MessageJobService(tx);
        await svc.markSent(job.id);
        await svc.scheduleNextForJob(job);
      });
      logger.info(`Job ${job.id} sent for user ${job.userId}`);
    } catch (error: any) {
      const reason = error?.message || 'Unknown error';
      
      if (!emailSent) {
        // Email delivery failed, safe to retry
        await this.jobService.markRetry(job.id, job.attempts, reason);
        logger.warn(`Job ${job.id} failed. Scheduled for retry.`, { reason });
      } else {
        // Email was sent but post-send operations failed
        // DO NOT retry as it would send duplicate email
        logger.error(`Job ${job.id} email sent but post-send operations failed. Manual intervention may be required.`, {
          jobId: job.id,
          userId: job.userId,
          error: reason,
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
    if (this.isRunning) {
      throw new Error('Worker is already running');
    }
    
    this.isRunning = true;
    // Create a new shutdown promise each time start is called
    this.shutdownPromise = new Promise((resolve) => {
      this.shutdownResolve = resolve;
    });
    
    while (this.isRunning) {
      const processed = await this.runOnce();
      if (processed === 0) {
        await new Promise((resolve) => setTimeout(resolve, env.WORKER_IDLE_MS));
      }
    }
    
    // Resolve the shutdown promise when the loop exits
    if (this.shutdownResolve) {
      this.shutdownResolve();
    }
    this.shutdownResolve = null;
    this.shutdownPromise = null;
  }

  stop(): void {
    this.isRunning = false;
  }

  /**
   * Wait for the worker to gracefully shut down.
   * This should be called after stop() to ensure the current iteration completes.
   */
  async waitForShutdown(): Promise<void> {
    if (!this.shutdownPromise) {
      // Worker hasn't started or has already shut down
      return;
    }
    await this.shutdownPromise;
  }
}
