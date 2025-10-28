-- Create transferred_subscriptions table for people who transferred subscriptions
-- This table will have similar RLS policies as subscription_users table

CREATE TABLE transferred_subscriptions (
    id SERIAL PRIMARY KEY,
    primary_user_email VARCHAR(255) NOT NULL,
    sub_user_email VARCHAR(255) NOT NULL,
    subscription_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add unique constraint to prevent duplicate transfers
    UNIQUE(primary_user_email, sub_user_email)
);

-- Create indexes for better performance
CREATE INDEX idx_transferred_subscriptions_primary_user ON transferred_subscriptions(primary_user_email);
CREATE INDEX idx_transferred_subscriptions_sub_user ON transferred_subscriptions(sub_user_email);
CREATE INDEX idx_transferred_subscriptions_status ON transferred_subscriptions(status);
CREATE INDEX idx_transferred_subscriptions_dates ON transferred_subscriptions(subscription_start_date, subscription_end_date);

-- Enable Row Level Security (RLS)
ALTER TABLE transferred_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies similar to subscription_users table

-- Policy 1: Admin users can access all transferred_subscriptions data
CREATE POLICY "Admin users can access all transferred_subscriptions data" 
ON transferred_subscriptions 
FOR ALL 
TO public 
USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE admin_users.email = auth.jwt() ->> 'email'
    )
);

-- Policy 2: Users can manage their own transferred subscription data
CREATE POLICY "Users can manage their own transferred subscription data" 
ON transferred_subscriptions 
FOR ALL 
TO public 
USING (
    primary_user_email = auth.jwt() ->> 'email' 
    OR 
    sub_user_email = auth.jwt() ->> 'email'
);

-- Add comments for documentation
COMMENT ON TABLE transferred_subscriptions IS 'Table for managing transferred subscriptions with primary and sub-user relationships';
COMMENT ON COLUMN transferred_subscriptions.primary_user_email IS 'Email of the primary user who owns the subscription';
COMMENT ON COLUMN transferred_subscriptions.sub_user_email IS 'Email of the sub-user who has access to the subscription';
COMMENT ON COLUMN transferred_subscriptions.subscription_start_date IS 'When the subscription period starts';
COMMENT ON COLUMN transferred_subscriptions.subscription_end_date IS 'When the subscription period ends (NULL for ongoing)';
COMMENT ON COLUMN transferred_subscriptions.transfer_date IS 'When this transfer was recorded';
COMMENT ON COLUMN transferred_subscriptions.status IS 'Current status of the transferred subscription';
