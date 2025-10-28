-- Add WelcomeEmailSent column to User table
ALTER TABLE "User" ADD COLUMN "WelcomeEmailSent" BOOLEAN DEFAULT FALSE;

-- Update existing users to have WelcomeEmailSent as false
UPDATE "User" SET "WelcomeEmailSent" = FALSE WHERE "WelcomeEmailSent" IS NULL;
