-- Create admin_users table for admin access control
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(100) DEFAULT 'admin',
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Create index on is_active for filtering active admins
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to read their own record
CREATE POLICY "Admins can read their own record" ON admin_users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Create policy to allow service role to read all admin records
CREATE POLICY "Service role can read all admin records" ON admin_users
    FOR SELECT USING (auth.role() = 'service_role');

-- Create policy to allow service role to insert admin records
CREATE POLICY "Service role can insert admin records" ON admin_users
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Create policy to allow service role to update admin records
CREATE POLICY "Service role can update admin records" ON admin_users
    FOR UPDATE USING (auth.role() = 'service_role');

-- Create policy to allow service role to delete admin records
CREATE POLICY "Service role can delete admin records" ON admin_users
    FOR DELETE USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some example admin users (replace with actual admin emails)
-- INSERT INTO admin_users (email, role, permissions) VALUES 
--     ('admin@MediRate.com', 'super_admin', '{"all": true}'),
--     ('support@MediRate.com', 'support_admin', '{"user_management": true, "content_management": true}'),
--     ('analytics@MediRate.com', 'analytics_admin', '{"analytics": true, "reports": true}');

-- Grant necessary permissions to authenticated users for reading
GRANT SELECT ON admin_users TO authenticated;

-- Grant all permissions to service role
GRANT ALL ON admin_users TO service_role;

-- Grant usage on sequence
GRANT USAGE, SELECT ON SEQUENCE admin_users_id_seq TO service_role; 