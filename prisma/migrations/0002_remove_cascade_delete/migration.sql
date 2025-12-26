-- AlterTable
-- Remove CASCADE delete from MessageJob foreign key to preserve historical SENT jobs
ALTER TABLE "MessageJob" DROP CONSTRAINT "MessageJob_userId_fkey";

-- Re-add foreign key without CASCADE delete; use ON DELETE SET NULL to preserve historical jobs
ALTER TABLE "MessageJob" ADD CONSTRAINT "MessageJob_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
