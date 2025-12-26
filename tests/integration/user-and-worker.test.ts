import request from 'supertest';
import nock from 'nock';
import { DateTime } from 'luxon';
import { createApp } from '../../src/app';
import { JobWorker } from '../../src/worker/jobWorker';
import { prisma } from '../setup';
import { MessageStatus, MessageType } from '@prisma/client';

const app = createApp();

const basePayload = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  birthDate: '1990-05-02',
  timezone: 'Asia/Jakarta',
};

describe('User API', () => {
  it('creates user and schedules one pending job', async () => {
    const res = await request(app).post('/api/user').send(basePayload).expect(201);
    expect(res.body.data.email).toBe(basePayload.email);

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(1);
    const jobs = await prisma.messageJob.findMany();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe(MessageStatus.PENDING);
  });

  it('updates user and reschedules job', async () => {
    const createRes = await request(app).post('/api/user').send(basePayload).expect(201);
    const userId = createRes.body.data.id;

    const updatedPayload = { ...basePayload, timezone: 'America/New_York' };
    await request(app).put(`/api/user/${userId}`).send(updatedPayload).expect(200);

    const jobs = await prisma.messageJob.findMany({ where: { userId } });
    expect(jobs).toHaveLength(1);
    expect(jobs[0].status).toBe(MessageStatus.PENDING);
  });

  it('deletes user and associated jobs', async () => {
    const createRes = await request(app).post('/api/user').send(basePayload).expect(201);
    const userId = createRes.body.data.id;

    await request(app).delete(`/api/user/${userId}`).expect(200);

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(0);
    const jobs = await prisma.messageJob.findMany();
    expect(jobs).toHaveLength(0);
  });
});

describe('Worker processing', () => {
  const emailServiceHost = 'https://email-service.digitalenvision.com.au';

  beforeEach(() => {
    nock.cleanAll();
  });

  it('processes due job successfully and schedules next year', async () => {
    const user = await prisma.user.create({
      data: {
        ...basePayload,
        birthDate: new Date(`${basePayload.birthDate}T00:00:00Z`),
      },
    });

    const job = await prisma.messageJob.create({
      data: {
        userId: user.id,
        type: MessageType.BIRTHDAY,
        scheduledAtUtc: new Date(Date.now() - 1000),
        status: MessageStatus.PENDING,
        attempts: 0,
      },
    });

    const scope = nock(emailServiceHost).post('/send-email').reply(200, { success: true });

    const worker = new JobWorker(prisma);
    const processed = await worker.runOnce();
    expect(processed).toBe(1);
    expect(scope.isDone()).toBe(true);

    const updatedJob = await prisma.messageJob.findUnique({ where: { id: job.id } });
    expect(updatedJob?.status).toBe(MessageStatus.SENT);

    const nextJobs = await prisma.messageJob.findMany({ where: { userId: user.id, status: MessageStatus.PENDING } });
    expect(nextJobs).toHaveLength(1);
    const nextSchedule = DateTime.fromJSDate(nextJobs[0].scheduledAtUtc).setZone(user.timezone);
    const now = DateTime.now().setZone(user.timezone);
    // Next birthday should be in the future
    expect(nextSchedule > now).toBe(true);
    // Next birthday should be on the user's birth month and day
    expect(nextSchedule.month).toBe(5);
    expect(nextSchedule.day).toBe(2);
  });

  it('marks job for retry on failure', async () => {
    const user = await prisma.user.create({
      data: { ...basePayload, birthDate: new Date(`${basePayload.birthDate}T00:00:00Z`) },
    });

    const job = await prisma.messageJob.create({
      data: {
        userId: user.id,
        type: MessageType.BIRTHDAY,
        scheduledAtUtc: new Date(Date.now() - 1000),
        status: MessageStatus.PENDING,
        attempts: 0,
      },
    });

    const scope = nock(emailServiceHost).post('/send-email').reply(500, { error: 'fail' });

    const worker = new JobWorker(prisma);
    const processed = await worker.runOnce();
    expect(processed).toBe(1);
    expect(scope.isDone()).toBe(true);

    const updated = await prisma.messageJob.findUnique({ where: { id: job.id } });
    expect(updated?.status).toBe(MessageStatus.RETRY);
    expect(updated?.nextAttemptAtUtc).not.toBeNull();
  });

  it('prevents duplicate processing with concurrent workers', async () => {
    const user = await prisma.user.create({
      data: { ...basePayload, birthDate: new Date(`${basePayload.birthDate}T00:00:00Z`) },
    });

    await prisma.messageJob.create({
      data: {
        userId: user.id,
        type: MessageType.BIRTHDAY,
        scheduledAtUtc: new Date(Date.now() - 1000),
        status: MessageStatus.PENDING,
        attempts: 0,
      },
    });

    let requestCount = 0;
    nock(emailServiceHost)
      .post('/send-email')
      .times(1)
      .reply(200, function () {
        requestCount++;
        return { success: true };
      });

    const workerA = new JobWorker(prisma);
    const workerB = new JobWorker(prisma);

    const [countA, countB] = await Promise.all([workerA.runOnce(), workerB.runOnce()]);
    expect(countA + countB).toBe(1);
    expect(requestCount).toBe(1);
  });
});
