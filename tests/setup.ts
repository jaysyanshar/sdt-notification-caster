import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { newDb } from 'pg-mem';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { setPrismaClient } from '../src/shared/prisma/client';

process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/test';
process.env.EMAIL_SERVICE_URL = 'https://email-service.digitalenvision.com.au';
process.env.EMAIL_SERVICE_ENDPOINT = '/send-email';
process.env.EMAIL_TIMEOUT_MS = '2000';
process.env.WORKER_BATCH_SIZE = '5';
process.env.WORKER_IDLE_MS = '0';
process.env.PORT = '3000';
process.env.LOG_LEVEL = 'error';

const db = newDb({ autoCreateForeignKeyIndices: true });
db.public.registerFunction({ name: 'gen_random_uuid', returns: 'uuid', implementation: randomUUID });

const pg = db.adapters.createPg();
const pool = new pg.Pool();
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

beforeAll(async () => {
  const migrationsDir = path.join(__dirname, '../prisma/migrations');
  if (fs.existsSync(migrationsDir)) {
    const folders = fs.readdirSync(migrationsDir).sort();
    for (const folder of folders) {
      const migrationPath = path.join(migrationsDir, folder, 'migration.sql');
      if (fs.existsSync(migrationPath)) {
        const sql = fs.readFileSync(migrationPath, 'utf8');
        await db.public.none(sql);
      }
    }
  }

  setPrismaClient(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.messageJob.deleteMany();
  await prisma.user.deleteMany();
});

export { prisma };
