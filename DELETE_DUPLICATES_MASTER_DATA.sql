-- Delete duplicate rows from master_data_sept_2 table
-- This keeps one row (the one with the minimum id) when multiple rows have identical data
-- Excludes id, created_at, and updated_at from comparison (since these are auto-generated)
-- Handles NULL values correctly by using COALESCE

-- Step 1: First, let's see how many duplicates exist (for verification)
-- This query shows you how many duplicate rows will be deleted before you actually delete them
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        COALESCE(new_field::text, ''),
        COALESCE(service_category::text, ''),
        COALESCE(service_sub_category::text, ''),
        COALESCE(state_id_pk::text, ''),
        COALESCE(state_name::text, ''),
        COALESCE(state_code::text, ''),
        COALESCE(filename::text, ''),
        COALESCE(page_number::text, ''),
        COALESCE(service_id_pk::text, ''),
        COALESCE(service_code::text, ''),
        COALESCE(service_description::text, ''),
        COALESCE(rate::text, ''),
        COALESCE(rate_last_updated::text, ''),
        COALESCE(rate_effective_date::text, ''),
        COALESCE(duration_unit::text, ''),
        COALESCE(minutes::text, ''),
        COALESCE(program::text, ''),
        COALESCE(modifier_1::text, ''),
        COALESCE(modifier_1_details::text, ''),
        COALESCE(modifier_2::text, ''),
        COALESCE(modifier_2_details::text, ''),
        COALESCE(modifier_3::text, ''),
        COALESCE(modifier_3_details::text, ''),
        COALESCE(modifier_4::text, ''),
        COALESCE(modifier_4_details::text, ''),
        COALESCE(fee::text, ''),
        COALESCE(max_fee::text, ''),
        COALESCE(modifier_id_pk::text, ''),
        COALESCE(service_id_fk::text, ''),
        COALESCE(prior_auth_required::text, ''),
        COALESCE(comments::text, ''),
        COALESCE(location_region::text, ''),
        COALESCE(update_id_pk::text, ''),
        COALESCE(times_rate_updated::text, ''),
        COALESCE(percentage_change::text, ''),
        COALESCE(last_database_refresh::text, ''),
        COALESCE(requires_pa::text, ''),
        COALESCE(rate_per_hour::text, ''),
        COALESCE(provider_type::text, ''),
        COALESCE(age::text, ''),
        COALESCE(unnamed_40::text, ''),
        COALESCE(unnamed_41::text, '')
      ORDER BY id
    ) as row_num
  FROM master_data_sept_2
)
SELECT 
  COUNT(*) as total_duplicate_rows_to_delete,
  COUNT(DISTINCT id) as unique_duplicate_groups
FROM duplicates
WHERE row_num > 1;

-- Step 2: Actually delete the duplicates (keeps the row with minimum id in each duplicate group)
-- IMPORTANT: Run Step 1 first to see how many rows will be deleted!
-- Then uncomment and run this to actually delete the duplicates:
/*
DELETE FROM master_data_sept_2
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY 
          COALESCE(new_field::text, ''),
          COALESCE(service_category::text, ''),
          COALESCE(service_sub_category::text, ''),
          COALESCE(state_id_pk::text, ''),
          COALESCE(state_name::text, ''),
          COALESCE(state_code::text, ''),
          COALESCE(filename::text, ''),
          COALESCE(page_number::text, ''),
          COALESCE(service_id_pk::text, ''),
          COALESCE(service_code::text, ''),
          COALESCE(service_description::text, ''),
          COALESCE(rate::text, ''),
          COALESCE(rate_last_updated::text, ''),
          COALESCE(rate_effective_date::text, ''),
          COALESCE(duration_unit::text, ''),
          COALESCE(minutes::text, ''),
          COALESCE(program::text, ''),
          COALESCE(modifier_1::text, ''),
          COALESCE(modifier_1_details::text, ''),
          COALESCE(modifier_2::text, ''),
          COALESCE(modifier_2_details::text, ''),
          COALESCE(modifier_3::text, ''),
          COALESCE(modifier_3_details::text, ''),
          COALESCE(modifier_4::text, ''),
          COALESCE(modifier_4_details::text, ''),
          COALESCE(fee::text, ''),
          COALESCE(max_fee::text, ''),
          COALESCE(modifier_id_pk::text, ''),
          COALESCE(service_id_fk::text, ''),
          COALESCE(prior_auth_required::text, ''),
          COALESCE(comments::text, ''),
          COALESCE(location_region::text, ''),
          COALESCE(update_id_pk::text, ''),
          COALESCE(times_rate_updated::text, ''),
          COALESCE(percentage_change::text, ''),
          COALESCE(last_database_refresh::text, ''),
          COALESCE(requires_pa::text, ''),
          COALESCE(rate_per_hour::text, ''),
          COALESCE(provider_type::text, ''),
          COALESCE(age::text, ''),
          COALESCE(unnamed_40::text, ''),
          COALESCE(unnamed_41::text, '')
        ORDER BY id
      ) as row_num
    FROM master_data_sept_2
  ) AS ranked
  WHERE row_num > 1
);
*/

-- Step 3: Verify deletion (run this after deletion to confirm no duplicates remain)
/*
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        COALESCE(new_field::text, ''),
        COALESCE(service_category::text, ''),
        COALESCE(service_sub_category::text, ''),
        COALESCE(state_id_pk::text, ''),
        COALESCE(state_name::text, ''),
        COALESCE(state_code::text, ''),
        COALESCE(filename::text, ''),
        COALESCE(page_number::text, ''),
        COALESCE(service_id_pk::text, ''),
        COALESCE(service_code::text, ''),
        COALESCE(service_description::text, ''),
        COALESCE(rate::text, ''),
        COALESCE(rate_last_updated::text, ''),
        COALESCE(rate_effective_date::text, ''),
        COALESCE(duration_unit::text, ''),
        COALESCE(minutes::text, ''),
        COALESCE(program::text, ''),
        COALESCE(modifier_1::text, ''),
        COALESCE(modifier_1_details::text, ''),
        COALESCE(modifier_2::text, ''),
        COALESCE(modifier_2_details::text, ''),
        COALESCE(modifier_3::text, ''),
        COALESCE(modifier_3_details::text, ''),
        COALESCE(modifier_4::text, ''),
        COALESCE(modifier_4_details::text, ''),
        COALESCE(fee::text, ''),
        COALESCE(max_fee::text, ''),
        COALESCE(modifier_id_pk::text, ''),
        COALESCE(service_id_fk::text, ''),
        COALESCE(prior_auth_required::text, ''),
        COALESCE(comments::text, ''),
        COALESCE(location_region::text, ''),
        COALESCE(update_id_pk::text, ''),
        COALESCE(times_rate_updated::text, ''),
        COALESCE(percentage_change::text, ''),
        COALESCE(last_database_refresh::text, ''),
        COALESCE(requires_pa::text, ''),
        COALESCE(rate_per_hour::text, ''),
        COALESCE(provider_type::text, ''),
        COALESCE(age::text, ''),
        COALESCE(unnamed_40::text, ''),
        COALESCE(unnamed_41::text, '')
      ORDER BY id
    ) as row_num
  FROM master_data_sept_2
)
SELECT 
  COUNT(*) as remaining_duplicates
FROM duplicates
WHERE row_num > 1;
-- Should return 0 if deletion was successful
*/

