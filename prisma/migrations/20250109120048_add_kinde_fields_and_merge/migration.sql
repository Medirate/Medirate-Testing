-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdOn" TIMESTAMP(3),
ADD COLUMN     "failedSignIns" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSignedIn" TIMESTAMP(3),
ADD COLUMN     "picture" TEXT,
ADD COLUMN     "totalSignIns" INTEGER NOT NULL DEFAULT 0;
