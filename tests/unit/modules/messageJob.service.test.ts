import { DateTime } from 'luxon';
import { MessageJobService } from '../../../src/modules/jobs/messageJob.service';
import { MessageStatus, MessageType } from '@prisma/client';

function createPrismaMock() {
  return {
    messageJob: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
  } as any;
}

describe('MessageJobService (unit)', () => {
  it('scheduleNextBirthday: creates a pending birthday job at computed time', async () => {
    const prisma = createPrismaMock();
    const service = new MessageJobService(prisma);

    const user: any = {
      id: 'u1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      timezone: 'Asia/Jakarta',
      birthDate: new Date('1990-05-02T00:00:00Z'),
    };

    prisma.messageJob.create.mockResolvedValue({ id: 'j1' });

    const now = DateTime.fromISO('2024-05-01T00:00:00Z');
    await service.scheduleNextBirthday(user, now);

    expect(prisma.messageJob.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          type: MessageType.BIRTHDAY,
          status: MessageStatus.PENDING,
          attempts: 0,
          scheduledAtUtc: expect.any(Date),
        }),
      })
    );
  });

  it('rescheduleBirthday: deletes pending/retry birthday jobs then creates a new one', async () => {
    const prisma = createPrismaMock();
    const service = new MessageJobService(prisma);

    const user: any = {
      id: 'u1',
      timezone: 'Asia/Jakarta',
      birthDate: new Date('1990-05-02T00:00:00Z'),
    };

    prisma.messageJob.create.mockResolvedValue({ id: 'j2' });

    const now = DateTime.fromISO('2024-05-01T00:00:00Z');
    await service.rescheduleBirthday(user, now);

    expect(prisma.messageJob.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u1',
          type: MessageType.BIRTHDAY,
        }),
      })
    );
    expect(prisma.messageJob.create).toHaveBeenCalledTimes(1);
  });

  it('markSent: updates status to SENT and increments attempts', async () => {
    const prisma = createPrismaMock();
    const service = new MessageJobService(prisma);

    await service.markSent('j1');

    expect(prisma.messageJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'j1' },
        data: expect.objectContaining({
          status: MessageStatus.SENT,
          sentAtUtc: expect.any(Date),
          attempts: { increment: 1 },
        }),
      })
    );
  });

  it('markRetry: sets status RETRY and nextAttemptAtUtc', async () => {
    const prisma = createPrismaMock();
    const service = new MessageJobService(prisma);

    await service.markRetry('j1', 0, 'boom');

    expect(prisma.messageJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'j1' },
        data: expect.objectContaining({
          status: MessageStatus.RETRY,
          attempts: 1,
          nextAttemptAtUtc: expect.any(Date),
          lastError: 'boom',
        }),
      })
    );
  });
});

