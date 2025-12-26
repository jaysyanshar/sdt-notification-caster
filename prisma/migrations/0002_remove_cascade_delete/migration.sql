-- AlterTable
-- Make userId nullable to support ON DELETE SET NULL behavior
ALTER TABLE "MessageJob" ALTER COLUMN "userId" DROP NOT NULL;

-- Remove CASCADE delete from MessageJob foreign key to preserve historical SENT jobs
ALTER TABLE "MessageJob" DROP CONSTRAINT "MessageJob_userId_fkey";

-- Re-add foreign key without CASCADE delete; use ON DELETE SET NULL to preserve historical jobs
-- Data retention policy: PENDING and RETRY jobs are deleted manually by application code
-- to prevent orphaned jobs from running. SENT jobs are preserved for historical tracking
-- with userId set to NULL.
ALTER TABLE "MessageJob" ADD CONSTRAINT "MessageJob_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
