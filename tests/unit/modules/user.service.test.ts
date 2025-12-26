import { UserService } from '../../../src/modules/user/user.service';
import { ValidationError, NotFoundError } from '../../../src/shared/errors/AppError';
import { MessageJobService } from '../../../src/modules/jobs/messageJob.service';

function createMockPrisma() {
  const tx: any = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    messageJob: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const prisma: any = {
    $transaction: jest.fn(async (fn: any) => fn(tx)),
    user: tx.user,
    messageJob: tx.messageJob,
  };

  return { prisma, tx };
}

describe('UserService (unit)', () => {
  const validInput = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    birthDate: '1990-05-02',
    timezone: 'Asia/Jakarta',
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('createUser: creates user and schedules birthday job', async () => {
    const { prisma, tx } = createMockPrisma();

    const createdUser = {
      id: 'u1',
      ...validInput,
      birthDate: new Date('1990-05-02T00:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tx.user.create.mockResolvedValue(createdUser);

    // UserService creates MessageJobService internally, so mock the prototype method.
    const scheduleSpy = jest
      .spyOn(MessageJobService.prototype, 'scheduleNextBirthday')
      .mockResolvedValue({ id: 'j1' } as any);

    const service = new UserService(prisma as any);
    const result = await service.createUser(validInput as any);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: validInput.email,
          timezone: validInput.timezone,
          birthDate: new Date('1990-05-02T00:00:00Z'),
        }),
      })
    );
    expect(result.user.id).toBe('u1');

    expect(scheduleSpy).toHaveBeenCalledTimes(1);
    const [scheduledUser] = (scheduleSpy as jest.Mock).mock.calls[0];
    expect(scheduledUser).toMatchObject({ id: 'u1', email: validInput.email, timezone: validInput.timezone });
  });

  it('createUser: throws ValidationError on invalid input', async () => {
    const { prisma } = createMockPrisma();

    const service = new UserService(prisma as any);
    await expect(
      service.createUser({ ...validInput, email: 'not-an-email' } as any)
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('updateUser: throws NotFoundError when user does not exist', async () => {
    const { prisma, tx } = createMockPrisma();
    tx.user.findUnique.mockResolvedValue(null);

    const service = new UserService(prisma as any);
    await expect(service.updateUser('missing', validInput as any)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('deleteUser: deletes pending/retry jobs then deletes user', async () => {
    const { prisma, tx } = createMockPrisma();
    tx.user.findUnique.mockResolvedValue({ id: 'u1' });
    tx.user.delete.mockResolvedValue({ id: 'u1' });

    const service = new UserService(prisma as any);
    await service.deleteUser('u1');

    expect(tx.messageJob.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u1' }) })
    );
    expect(tx.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });
});
