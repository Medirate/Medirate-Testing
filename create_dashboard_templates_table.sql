-- Create table for storing user templates
-- This table stores saved filter configurations for all pages (dashboard, state-rate-comparison-all, etc.)

CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  page_name VARCHAR(100) NOT NULL DEFAULT 'dashboard', -- For future expansion to other pages
  template_data JSONB NOT NULL, -- Stores all filter selections, dates, sort config, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_default BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, template_name, page_name) -- Prevent duplicate template names per user per page
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_page_name ON templates(page_name);

-- Add comment
COMMENT ON TABLE templates IS 'Stores user-saved filter templates for all pages. Templates are isolated per user via user_id and separated by page_name.';
COMMENT ON COLUMN templates.template_data IS 'JSONB object containing page-specific filter configurations. Structure varies by page_name (dashboard vs state-rate-comparison-all).';
COMMENT ON COLUMN templates.page_name IS 'Page identifier: "dashboard" or "state-rate-comparison-all". Used to separate templates for different pages with different filter structures.';

-- Enable Row Level Security
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Note: Since this application uses KindeAuth (not Supabase Auth), 
-- the API routes use service role which bypasses RLS.
-- These policies provide an additional security layer for direct database access.

-- Policy: Users can SELECT their own templates
-- This uses a function that attempts to get user_id from various sources
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS INT AS $$
DECLARE
  user_email TEXT;
  user_id INT;
BEGIN
  -- Try to get email from Supabase auth (if available)
  user_email := COALESCE(
    (auth.jwt() ->> 'email'),
    current_setting('request.jwt.claims', true)::json->>'email',
    NULL
  );
  
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Look up UserID from User table
  SELECT "UserID" INTO user_id
  FROM "User"
  WHERE "Email" = user_email
  LIMIT 1;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Users can SELECT their own templates
CREATE POLICY "Users can view their own templates"
  ON templates
  FOR SELECT
  USING (user_id = get_current_user_id());

-- Policy: Users can INSERT their own templates
-- Note: WITH CHECK ensures user_id matches current user
CREATE POLICY "Users can create their own templates"
  ON templates
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

-- Policy: Users can UPDATE their own templates
CREATE POLICY "Users can update their own templates"
  ON templates
  FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

-- Policy: Users can DELETE their own templates
CREATE POLICY "Users can delete their own templates"
  ON templates
  FOR DELETE
  USING (user_id = get_current_user_id());

-- Grant necessary permissions to authenticated users
-- Note: API routes use service role which bypasses RLS, so these grants are for direct client access
GRANT SELECT, INSERT, UPDATE, DELETE ON templates TO authenticated;

