-- Add account_role column to registrationform table
ALTER TABLE registrationform 
ADD COLUMN account_role VARCHAR(50);

-- Add primary_user_email column for sub users
ALTER TABLE registrationform 
ADD COLUMN primary_user_email VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX idx_registrationform_account_role ON registrationform(account_role);
CREATE INDEX idx_registrationform_primary_user_email ON registrationform(primary_user_email);

-- Add check constraint for valid roles
ALTER TABLE registrationform 
ADD CONSTRAINT chk_account_role 
CHECK (account_role IN ('subscription_manager', 'user', 'sub_user') OR account_role IS NULL);
