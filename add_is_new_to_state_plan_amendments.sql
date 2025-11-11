-- Add is_new column to state_plan_amendments table
-- This column tracks new entries for email alert notifications

ALTER TABLE state_plan_amendments
ADD COLUMN IF NOT EXISTS is_new VARCHAR(10) DEFAULT 'no';

-- Update all existing rows to 'no' (not new)
UPDATE state_plan_amendments
SET is_new = 'no'
WHERE is_new IS NULL;

-- Add comment to column
COMMENT ON COLUMN state_plan_amendments.is_new IS 'Tracks new entries for email alerts: yes = new entry, no = existing entry';

