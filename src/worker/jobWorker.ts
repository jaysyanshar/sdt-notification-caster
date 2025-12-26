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

  private createShutdownPromise(): void {
    this.shutdownPromise = new Promise((resolve) => {
      this.shutdownResolve = resolve;
    });
  }

  private cleanupShutdownPromise(): void {
    // Capture the resolve function before nullifying references
    const resolve = this.shutdownResolve;
    // Nullify references first to prevent new waitForShutdown() calls from waiting
    this.shutdownResolve = null;
    this.shutdownPromise = null;
    // Resolve the promise after nullifying to ensure waitForShutdown() doesn't wait on a null promise
    // Note: In Node.js single-threaded event loop, there's no race condition here
    if (resolve) {
      resolve();
    }
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
    // Note: In Node.js single-threaded event loop, this check is thread-safe
    // as no other code can execute between the check and the assignment
    if (this.isRunning) {
      throw new Error('Worker is already running. Stop the worker before starting again.');
    }
    
    this.isRunning = true;
    this.createShutdownPromise();
    
    while (this.isRunning) {
      const processed = await this.runOnce();
      if (processed === 0) {
        await new Promise((resolve) => setTimeout(resolve, env.WORKER_IDLE_MS));
      }
    }
    
    this.cleanupShutdownPromise();
  }

  /**
   * Stop the worker and wait for graceful shutdown.
   * This ensures the current iteration completes before returning.
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    
    if (!this.shutdownPromise) {
      // Worker hasn't started or has already shut down
      return;
    }
    await this.shutdownPromise;
  }
}
