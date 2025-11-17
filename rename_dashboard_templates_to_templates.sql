-- Rename dashboard_templates table to templates
-- This table now serves multiple pages (dashboard, state-rate-comparison-all, etc.)

ALTER TABLE IF EXISTS dashboard_templates RENAME TO templates;

-- Rename indexes
ALTER INDEX IF EXISTS idx_dashboard_templates_user_id RENAME TO idx_templates_user_id;
ALTER INDEX IF EXISTS idx_dashboard_templates_page_name RENAME TO idx_templates_page_name;

-- Update comments
COMMENT ON TABLE templates IS 'Stores user-saved filter templates for all pages. Templates are isolated per user via user_id and separated by page_name.';
COMMENT ON COLUMN templates.template_data IS 'JSONB object containing page-specific filter configurations. Structure varies by page_name (dashboard vs state-rate-comparison-all).';
COMMENT ON COLUMN templates.page_name IS 'Page identifier: "dashboard" or "state-rate-comparison-all". Used to separate templates for different pages with different filter structures.';

-- Update RLS policies (drop old ones and recreate with new table name)
DROP POLICY IF EXISTS "Users can view their own templates" ON templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON templates;

-- Recreate policies with new table name
CREATE POLICY "Users can view their own templates"
  ON templates
  FOR SELECT
  USING (user_id = get_current_user_id());

CREATE POLICY "Users can create their own templates"
  ON templates
  FOR INSERT
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update their own templates"
  ON templates
  FOR UPDATE
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can delete their own templates"
  ON templates
  FOR DELETE
  USING (user_id = get_current_user_id());

-- Update grants
REVOKE ALL ON dashboard_templates FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON templates TO authenticated;

