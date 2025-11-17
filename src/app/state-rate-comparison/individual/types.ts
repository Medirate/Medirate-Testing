export interface FilterSet {
  serviceCategory: string;
  states: string[];
  serviceCode: string;
  stateOptions: { value: string; label: string }[];
  serviceCodeOptions: string[];
  number: number;  // Add number property for filter set identification
  program?: string;
  locationRegion?: string;
  modifier?: string;
  serviceDescription?: string;
  providerType?: string;
}

export interface ServiceData {
  state_name: string;
  service_category: string;
  service_code: string;
  modifier_1?: string;
  modifier_1_details?: string;
  modifier_2?: string;
  modifier_2_details?: string;
  modifier_3?: string;
  modifier_3_details?: string;
  modifier_4?: string;
  modifier_4_details?: string;
  rate: string;
  rate_per_hour?: string;
  rate_effective_date: string;
  program: string;
  location_region: string;
  duration_unit?: string;
  service_description?: string;
  provider_type?: string;
} 