-- Add bill_year column to bill_track_50 table
-- Set all existing entries to 2025

-- Step 1: Add the column (if it doesn't exist)
ALTER TABLE bill_track_50 
ADD COLUMN IF NOT EXISTS bill_year INTEGER;

-- Step 2: Set all existing entries to 2025
UPDATE bill_track_50 
SET bill_year = 2025 
WHERE bill_year IS NULL;

-- Step 3: Set default value for future inserts (optional, but helpful)
ALTER TABLE bill_track_50 
ALTER COLUMN bill_year SET DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Verify the update
SELECT COUNT(*) as total_rows, 
       COUNT(*) FILTER (WHERE bill_year = 2025) as rows_with_2025,
       COUNT(*) FILTER (WHERE bill_year IS NULL) as rows_with_null
FROM bill_track_50;

