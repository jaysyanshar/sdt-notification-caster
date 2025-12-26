import { MessageStatus, PrismaClient, User } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../shared/errors/AppError';
import { getPrismaClient } from '../../shared/prisma/client';
import { MessageJobService } from '../jobs/messageJob.service';
import { userSchema, UserInput } from './user.validation';

export class UserService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = getPrismaClient()) {
    this.prisma = prismaClient;
  }

  private parseInput(input: UserInput): UserInput {
    const result = userSchema.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.error.errors.map((e) => e.message).join(', '));
    }
    return result.data;
  }

  async createUser(input: UserInput): Promise<{ user: User }> {
    const data = this.parseInput(input);
    const birthDate = new Date(`${data.birthDate}T00:00:00Z`);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { ...data, birthDate },
      });

      const jobService = new MessageJobService(tx);
      await jobService.scheduleNextBirthday(created);
      return created;
    });

    return { user };
  }

  async updateUser(id: string, input: UserInput): Promise<{ user: User }> {
    const data = this.parseInput(input);
    const birthDate = new Date(`${data.birthDate}T00:00:00Z`);

    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('User not found');
      }

      const updated = await tx.user.update({ where: { id }, data: { ...data, birthDate } });
      const jobService = new MessageJobService(tx);
      await jobService.rescheduleBirthday(updated);
      return updated;
    });

    return { user };
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundError('User not found');
      }

      await tx.messageJob.deleteMany({
        where: {
          userId: id,
          status: { in: [MessageStatus.PENDING, MessageStatus.RETRY] },
        },
      });

      await tx.user.delete({ where: { id } });
    });
  }
}
