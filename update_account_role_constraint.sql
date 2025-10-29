-- Update the account_role constraint to include all valid roles
-- This fixes the constraint violation error when submitting forms with sub_user role

-- First, drop the existing constraint
ALTER TABLE registrationform DROP CONSTRAINT IF EXISTS chk_account_role;

-- Add the updated constraint with all valid roles
ALTER TABLE registrationform 
ADD CONSTRAINT chk_account_role 
CHECK (account_role IN ('subscription_manager', 'user', 'sub_user', 'primary_user', 'admin') OR account_role IS NULL);

-- Verify the constraint was added
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'chk_account_role' 
AND conrelid = 'registrationform'::regclass;
