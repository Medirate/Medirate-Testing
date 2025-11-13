-- Add service_lines_impacted_3 column to state_plan_amendments table
-- This column allows state plan amendments to have 4 service line columns, matching provider_alerts

ALTER TABLE state_plan_amendments
ADD COLUMN IF NOT EXISTS service_lines_impacted_3 VARCHAR(255);

-- Add comment to column
COMMENT ON COLUMN state_plan_amendments.service_lines_impacted_3 IS 'Fourth service line category impacted by this state plan amendment';

