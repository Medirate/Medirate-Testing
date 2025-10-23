-- SQL Commands to Add New Columns to Registration Form Table
-- Run these commands in your PostgreSQL database

-- Add account_role column to store the selected role
ALTER TABLE registrationform 
ADD COLUMN account_role VARCHAR(50);

-- Add primary_user_email column to store the primary user's email for sub users
ALTER TABLE registrationform 
ADD COLUMN primary_user_email VARCHAR(255);

-- Add index on account_role for better query performance
CREATE INDEX idx_registrationform_account_role ON registrationform(account_role);

-- Add index on primary_user_email for better query performance
CREATE INDEX idx_registrationform_primary_user_email ON registrationform(primary_user_email);

-- Add comments to document the new columns
COMMENT ON COLUMN registrationform.account_role IS 'The selected account role: subscription_manager, user, or sub_user';
COMMENT ON COLUMN registrationform.primary_user_email IS 'Email of the primary user/subscription manager for sub users';

-- Optional: Add check constraint to ensure valid account roles
ALTER TABLE registrationform 
ADD CONSTRAINT chk_account_role 
CHECK (account_role IN ('subscription_manager', 'user', 'sub_user') OR account_role IS NULL);

-- Update existing records to have default role if needed
-- UPDATE registrationform SET account_role = 'user' WHERE account_role IS NULL;
