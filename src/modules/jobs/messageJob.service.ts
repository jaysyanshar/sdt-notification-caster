import { MessageJob, MessageStatus, MessageType, Prisma, PrismaClient, User } from '@prisma/client';
import { DateTime } from 'luxon';
import { buildBirthdayMessage, calculateNextAttempt, calculateNextBirthdayUtc, getNextScheduleForType } from '../../shared/utils/scheduler';

export interface MessageJobWithUser extends MessageJob {
  user: User;
}

type DbClient = PrismaClient | Prisma.TransactionClient;

export class MessageJobService {
  constructor(private prisma: DbClient) {}

  async scheduleNextBirthday(user: User, now: DateTime = DateTime.utc()): Promise<MessageJob> {
    const scheduledAt = calculateNextBirthdayUtc(user.birthDate.toISOString().slice(0, 10), user.timezone, now).toJSDate();
    return this.prisma.messageJob.create({
      data: {
        userId: user.id,
        type: MessageType.BIRTHDAY,
        scheduledAtUtc: scheduledAt,
        status: MessageStatus.PENDING,
        attempts: 0,
      },
    });
  }

  async rescheduleBirthday(user: User, now: DateTime = DateTime.utc()): Promise<MessageJob> {
    await this.prisma.messageJob.deleteMany({
      where: {
        userId: user.id,
        type: MessageType.BIRTHDAY,
        status: { in: [MessageStatus.PENDING, MessageStatus.RETRY] },
      },
    });

    const scheduledAt = calculateNextBirthdayUtc(
      user.birthDate.toISOString().slice(0, 10),
      user.timezone,
      now,
    ).toJSDate();

    return this.prisma.messageJob.create({
      data: {
        userId: user.id,
        type: MessageType.BIRTHDAY,
        scheduledAtUtc: scheduledAt,
        status: MessageStatus.PENDING,
        attempts: 0,
      },
    });
  }

  async claimDueJobs(limit: number): Promise<MessageJobWithUser[]> {
    if (!(this.prisma instanceof PrismaClient)) {
      throw new Error('claimDueJobs must be called with a PrismaClient instance');
    }
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<MessageJobWithUser[]>`
        SELECT mj.*, row_to_json(u) as user
        FROM "MessageJob" mj
        JOIN "User" u ON u.id = mj."userId"
        WHERE mj.status IN ('PENDING', 'RETRY')
          AND mj."scheduledAtUtc" <= NOW()
          AND (mj."nextAttemptAtUtc" IS NULL OR mj."nextAttemptAtUtc" <= NOW())
        ORDER BY mj."scheduledAtUtc" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${limit}
      `;

      if (!rows.length) {
        return [];
      }

      const ids = rows.map((row: { id: string; }) => row.id);
      await tx.$executeRaw`UPDATE "MessageJob" SET status = 'SENDING', "updatedAt" = NOW() WHERE id IN (${Prisma.join(ids)})`;

      return rows.map((row: any) => ({ ...row, user: (row as any).user as User }));
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async markSent(jobId: string): Promise<void> {
    await this.prisma.messageJob.update({
      where: { id: jobId },
      data: { status: MessageStatus.SENT, sentAtUtc: new Date(), attempts: { increment: 1 } },
    });
  }

  async markRetry(jobId: string, attempts: number, error: string): Promise<void> {
    await this.prisma.messageJob.update({
      where: { id: jobId },
      data: {
        status: MessageStatus.RETRY,
        attempts: attempts + 1,
        nextAttemptAtUtc: calculateNextAttempt(attempts + 1),
        lastError: error,
      },
    });
  }

  async scheduleNextForJob(job: MessageJobWithUser): Promise<MessageJob> {
    const scheduledAtUtc = getNextScheduleForType(MessageType.BIRTHDAY, job.user);
    return this.prisma.messageJob.create({
      data: {
        userId: job.userId,
        type: job.type,
        scheduledAtUtc,
        status: MessageStatus.PENDING,
        attempts: 0,
      },
    });
  }

  buildMessage(job: MessageJobWithUser): string {
    switch (job.type) {
      case MessageType.BIRTHDAY:
        return buildBirthdayMessage(job.user);
      default:
        throw new Error('Unsupported job type');
    }
  }
}
