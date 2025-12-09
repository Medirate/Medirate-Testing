-- Query to retrieve the selected data from master_data_sept_2 table
-- Based on the Google Sheets selection showing Alabama H0020 service codes

SELECT 
  id,
  new_field,
  service_category,
  service_sub_category,
  state_id_pk,
  state_name,
  state_code,
  filename,
  page_number,
  service_id_pk,
  service_code,
  service_description,
  rate,
  rate_last_updated,
  rate_effective_date,
  duration_unit,
  minutes,
  program,
  modifier_1,
  modifier_1_details,
  modifier_2,
  modifier_2_details,
  modifier_3,
  modifier_3_details,
  modifier_4,
  modifier_4_details,
  fee,
  max_fee,
  modifier_id_pk,
  service_id_fk,
  prior_auth_required,
  comments,
  location_region,
  update_id_pk,
  times_rate_updated,
  percentage_change,
  last_database_refresh,
  requires_pa,
  rate_per_hour,
  provider_type,
  age,
  unnamed_40,
  unnamed_41,
  created_at,
  updated_at
FROM master_data_sept_2
WHERE 
  state_code = 'AL'
  AND service_code = 'H0020'
  AND service_description LIKE '%OPIOID USE DISORDER TREATMENT%'
  AND program = 'REHABILITATIV HF'
  AND duration_unit = 'PER SERVICE'
ORDER BY 
  rate_effective_date DESC,
  service_description,
  rate;

-- Alternative: More specific query matching the exact service descriptions shown
/*
SELECT *
FROM master_data_sept_2
WHERE 
  state_code = 'AL'
  AND service_code = 'H0020'
  AND (
    service_description = 'OPIOID USE DISORDER TREATMENT - METHODONE TREATMENT'
    OR service_description = 'OPIOID USE DISORDER TREATMENT - BUPRENORPHINE TREATMENT'
  )
  AND program = 'REHABILITATIV HF'
  AND duration_unit = 'PER SERVICE'
  AND rate_effective_date IN ('2024-10-07', '2023-10-01')
ORDER BY 
  rate_effective_date DESC,
  service_description;
*/

