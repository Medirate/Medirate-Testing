-- Create table to track Excel export row usage per subscription
-- This tracks usage for the entire subscription (shared by primary user and all sub-users)
-- Limits reset monthly based on subscription billing cycle

CREATE TABLE IF NOT EXISTS excel_export_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Primary user email (subscription owner)
    -- For Stripe: the email of the subscription owner
    -- For wire transfer: the email in wire_transfer_subscriptions table
    primary_user_email TEXT NOT NULL,
    
    -- Subscription type: 'stripe' or 'wire_transfer'
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('stripe', 'wire_transfer')),
    
    -- Current billing period (for monthly reset)
    -- For Stripe: matches current_period_start/current_period_end from Stripe
    -- For wire transfer: calculated monthly cycles from subscription_start_date
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Usage tracking
    rows_used INTEGER NOT NULL DEFAULT 0,
    rows_limit INTEGER NOT NULL DEFAULT 20000, -- 20k row limit per subscription
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per primary user per subscription type
    UNIQUE(primary_user_email, subscription_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_excel_export_usage_primary_user 
ON excel_export_usage(primary_user_email, subscription_type);

CREATE INDEX IF NOT EXISTS idx_excel_export_usage_period 
ON excel_export_usage(current_period_end);

-- Add comment to table
COMMENT ON TABLE excel_export_usage IS 'Tracks Excel export row usage per subscription. Limits reset monthly based on billing cycle. Shared across all users in a subscription (primary + sub-users).';

-- Add comments to columns
COMMENT ON COLUMN excel_export_usage.primary_user_email IS 'Email of the subscription owner (primary user). All sub-users share this limit.';
COMMENT ON COLUMN excel_export_usage.subscription_type IS 'Type of subscription: stripe or wire_transfer';
COMMENT ON COLUMN excel_export_usage.current_period_start IS 'Start of current billing period (for monthly reset calculation)';
COMMENT ON COLUMN excel_export_usage.current_period_end IS 'End of current billing period. When passed, usage resets.';
COMMENT ON COLUMN excel_export_usage.rows_used IS 'Number of rows exported in current billing period';
COMMENT ON COLUMN excel_export_usage.rows_limit IS 'Maximum rows allowed per billing period (default: 20000)';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_excel_export_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
-- Drop trigger if it exists to avoid errors on re-run
DROP TRIGGER IF EXISTS update_excel_export_usage_timestamp ON excel_export_usage;

CREATE TRIGGER update_excel_export_usage_timestamp
    BEFORE UPDATE ON excel_export_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_excel_export_usage_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE excel_export_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-run safety)
DROP POLICY IF EXISTS "Service role can access all excel export usage" ON excel_export_usage;
DROP POLICY IF EXISTS "Users can read their subscription usage" ON excel_export_usage;
DROP POLICY IF EXISTS "Users can update their subscription usage" ON excel_export_usage;
DROP POLICY IF EXISTS "Only service role can insert excel export usage" ON excel_export_usage;
DROP POLICY IF EXISTS "Only service role can delete excel export usage" ON excel_export_usage;

-- Policy 1: Service role has full access (for API operations)
CREATE POLICY "Service role can access all excel export usage" ON excel_export_usage
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can read their own subscription's usage
-- This includes primary users and sub-users (who share the same primary_user_email)
CREATE POLICY "Users can read their subscription usage" ON excel_export_usage
    FOR SELECT
    USING (
        -- User is the primary user
        LOWER(primary_user_email) = LOWER(auth.jwt() ->> 'email')
        OR
        -- User is a sub-user of this primary user (sub_users is JSONB array)
        EXISTS (
            SELECT 1 FROM subscription_users
            WHERE LOWER(subscription_users.primary_user) = LOWER(excel_export_usage.primary_user_email)
            AND subscription_users.sub_users IS NOT NULL
            AND LOWER(auth.jwt() ->> 'email') = ANY(
                SELECT LOWER(jsonb_array_elements_text(subscription_users.sub_users))
            )
        )
    );

-- Policy 3: Users can update their own subscription's usage (for row reservation)
-- This is needed when the API reserves rows during export
CREATE POLICY "Users can update their subscription usage" ON excel_export_usage
    FOR UPDATE
    USING (
        -- User is the primary user
        LOWER(primary_user_email) = LOWER(auth.jwt() ->> 'email')
        OR
        -- User is a sub-user of this primary user (sub_users is JSONB array)
        EXISTS (
            SELECT 1 FROM subscription_users
            WHERE LOWER(subscription_users.primary_user) = LOWER(excel_export_usage.primary_user_email)
            AND subscription_users.sub_users IS NOT NULL
            AND LOWER(auth.jwt() ->> 'email') = ANY(
                SELECT LOWER(jsonb_array_elements_text(subscription_users.sub_users))
            )
        )
    )
    WITH CHECK (
        -- User is the primary user
        LOWER(primary_user_email) = LOWER(auth.jwt() ->> 'email')
        OR
        -- User is a sub-user of this primary user (sub_users is JSONB array)
        EXISTS (
            SELECT 1 FROM subscription_users
            WHERE LOWER(subscription_users.primary_user) = LOWER(excel_export_usage.primary_user_email)
            AND subscription_users.sub_users IS NOT NULL
            AND LOWER(auth.jwt() ->> 'email') = ANY(
                SELECT LOWER(jsonb_array_elements_text(subscription_users.sub_users))
            )
        )
    );

-- Policy 4: Only service role can insert (records are created by API)
CREATE POLICY "Only service role can insert excel export usage" ON excel_export_usage
    FOR INSERT
    WITH CHECK (auth.role() = 'service_role');

-- Policy 5: Only service role can delete (for cleanup/maintenance)
CREATE POLICY "Only service role can delete excel export usage" ON excel_export_usage
    FOR DELETE
    USING (auth.role() = 'service_role');
