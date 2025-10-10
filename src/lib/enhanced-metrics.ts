// ============================================================================
// ENHANCED METRICS FUNCTIONS
// ============================================================================

export interface EnhancedMetricsData {
  provider_alerts: CompressedData;
  legislative_updates: CompressedData;
  service_categories: CompressedData;
  master_data: CompressedData;
  recent_rate_changes: CompressedData;
  summary: SummaryStats;
  metadata: Metadata;
}

export interface CompressedData {
  m: Record<string, Record<string, number>>;
  v: Record<string, number[]>;
  c: string[];
  total_records: number;
}

export interface SummaryStats {
  totalProviderAlerts: number;
  totalLegislativeUpdates: number;
  totalServiceCategories: number;
  totalMasterDataRecords: number;
  totalRecentRateChanges: number;
  newProviderAlerts: number;
  newLegislativeUpdates: number;
  lastUpdated: string;
  dataVersion: string;
  description: string;
}

export interface Metadata {
  generatedAt: string;
  version: string;
  description: string;
  tables: string[];
  compressionRatio: string;
}

export interface ProviderAlert {
  id: string;
  link?: string;
  state?: string;
  service_lines_impacted?: string;
  service_lines_impacted_1?: string;
  service_lines_impacted_2?: string;
  service_lines_impacted_3?: string;
  subject?: string;
  announcement_date?: string;
  is_new?: string;
  summary?: string;
}

export interface LegislativeUpdate {
  url: string;
  state?: string;
  bill_number?: string;
  service_lines_impacted?: string;
  service_lines_impacted_1?: string;
  service_lines_impacted_2?: string;
  service_lines_impacted_3?: string;
  name?: string;
  ai_summary?: string;
  bill_progress?: string;
  last_action?: string;
  created?: string;
  action_date?: string;
  sponsor_list?: string;
  date_extracted?: string;
  is_new?: string;
}

export interface ServiceCategory {
  id: number;
  categories?: string;
}

export interface MasterDataRecord {
  id: number;
  new_field?: string;
  service_category?: string;
  service_sub_category?: string;
  state_id_pk?: string;
  state_name?: string;
  state_code?: string;
  filename?: string;
  page_number?: string;
  service_id_pk?: string;
  service_code?: string;
  service_description?: string;
  rate?: string;
  rate_last_updated?: string;
  rate_effective_date?: string;
  duration_unit?: string;
  minutes?: string;
  program?: string;
  modifier_1?: string;
  modifier_1_details?: string;
  modifier_2?: string;
  modifier_2_details?: string;
  modifier_3?: string;
  modifier_3_details?: string;
  modifier_4?: string;
  modifier_4_details?: string;
  fee?: string;
  max_fee?: string;
  modifier_id_pk?: string;
  service_id_fk?: string;
  prior_auth_required?: string;
  comments?: string;
  location_region?: string;
  update_id_pk?: string;
  times_rate_updated?: string;
  percentage_change?: string;
  last_database_refresh?: string;
  requires_pa?: string;
  rate_per_hour?: string;
  provider_type?: string;
  age?: string;
  unnamed_40?: string;
  unnamed_41?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StateSummary {
  state: string;
  providerAlerts: {
    total: number;
    new: number;
  };
  legislativeUpdates: {
    total: number;
    new: number;
  };
  masterDataRecords: number;
  totalNewAlerts: number;
}

/**
 * Decompress a value from the compressed data
 */
export function decompressValue(
  mappings: Record<string, Record<string, number>>,
  columnName: string,
  compressedValue: number
): string | null {
  if (!mappings[columnName] || compressedValue === undefined || compressedValue === -1) {
    return null;
  }
  
  const realValue = Object.keys(mappings[columnName]).find(
    key => mappings[columnName][key] === compressedValue
  );
  return realValue || null;
}

/**
 * Decompress a record from the compressed data
 */
export function decompressRecord(
  data: CompressedData,
  recordIndex: number
): Record<string, any> {
  const record: Record<string, any> = {};
  
  data.c.forEach(columnName => {
    if (data.v[columnName] && data.v[columnName][recordIndex] !== undefined) {
      const decompressedValue = decompressValue(
        data.m,
        columnName,
        data.v[columnName][recordIndex]
      );
      record[columnName] = decompressedValue;
    }
  });
  
  return record;
}

/**
 * Fetch enhanced metrics from the API
 */
export async function fetchEnhancedMetrics(): Promise<EnhancedMetricsData> {
  try {
    const response = await fetch('/api/enhanced-metrics');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching enhanced metrics:', error);
    throw error;
  }
}

/**
 * Get all provider alerts from the enhanced metrics
 */
export function getProviderAlerts(data: EnhancedMetricsData): ProviderAlert[] {
  const alerts: ProviderAlert[] = [];
  
  if (!data.provider_alerts.c.length) return alerts;
  
  const recordCount = data.provider_alerts.v[data.provider_alerts.c[0]]?.length || 0;
  
  for (let i = 0; i < recordCount; i++) {
    const record = decompressRecord(data.provider_alerts, i);
    const alert: ProviderAlert = { id: '' };
    
    data.provider_alerts.c.forEach(col => {
      alert[col as keyof ProviderAlert] = record[col];
    });
    
    alerts.push(alert);
  }
  
  return alerts;
}

/**
 * Get all legislative updates from the enhanced metrics
 */
export function getLegislativeUpdates(data: EnhancedMetricsData): LegislativeUpdate[] {
  const updates: LegislativeUpdate[] = [];
  
  if (!data.legislative_updates.c.length) return updates;
  
  const recordCount = data.legislative_updates.v[data.legislative_updates.c[0]]?.length || 0;
  
  for (let i = 0; i < recordCount; i++) {
    const record = decompressRecord(data.legislative_updates, i);
    const update: LegislativeUpdate = { url: '' };
    
    data.legislative_updates.c.forEach(col => {
      update[col as keyof LegislativeUpdate] = record[col];
    });
    
    updates.push(update);
  }
  
  return updates;
}

/**
 * Get all service categories from the enhanced metrics
 */
export function getServiceCategories(data: EnhancedMetricsData): ServiceCategory[] {
  const categories: ServiceCategory[] = [];
  
  if (!data.service_categories.c.length) return categories;
  
  const recordCount = data.service_categories.v[data.service_categories.c[0]]?.length || 0;
  
  for (let i = 0; i < recordCount; i++) {
    const record = decompressRecord(data.service_categories, i);
    const category: ServiceCategory = { id: 0 };
    
    data.service_categories.c.forEach(col => {
      if (col === 'id') {
        category.id = parseInt(record[col] || '0');
      } else {
        (category as any)[col] = record[col];
      }
    });
    
    categories.push(category);
  }
  
  return categories;
}

/**
 * Get all master data records from the enhanced metrics
 */
export function getMasterDataRecords(data: EnhancedMetricsData): MasterDataRecord[] {
  const records: MasterDataRecord[] = [];
  
  if (!data.master_data.c.length) return records;
  
  const recordCount = data.master_data.v[data.master_data.c[0]]?.length || 0;
  
  for (let i = 0; i < recordCount; i++) {
    const record = decompressRecord(data.master_data, i);
    const masterRecord: MasterDataRecord = { id: 0 };
    
    data.master_data.c.forEach(col => {
      if (col === 'id') {
        masterRecord.id = parseInt(record[col] || '0');
      } else {
        (masterRecord as any)[col] = record[col];
      }
    });
    
    records.push(masterRecord);
  }
  
  return records;
}

/**
 * Get provider alerts for a specific state
 */
export function getProviderAlertsByState(
  data: EnhancedMetricsData,
  stateName: string
): ProviderAlert[] {
  const alerts = getProviderAlerts(data);
  return alerts.filter(alert => 
    alert.state && alert.state.toLowerCase().includes(stateName.toLowerCase())
  );
}

/**
 * Get legislative updates for a specific state
 */
export function getLegislativeUpdatesByState(
  data: EnhancedMetricsData,
  stateName: string
): LegislativeUpdate[] {
  const updates = getLegislativeUpdates(data);
  return updates.filter(update => 
    update.state && update.state.toLowerCase().includes(stateName.toLowerCase())
  );
}

/**
 * Get new provider alerts (is_new = 'yes')
 */
export function getNewProviderAlerts(data: EnhancedMetricsData): ProviderAlert[] {
  const alerts = getProviderAlerts(data);
  return alerts.filter(alert => alert.is_new === 'yes');
}

/**
 * Get new legislative updates (is_new = 'yes')
 */
export function getNewLegislativeUpdates(data: EnhancedMetricsData): LegislativeUpdate[] {
  const updates = getLegislativeUpdates(data);
  return updates.filter(update => update.is_new === 'yes');
}

/**
 * Get master data records for a specific state
 */
export function getMasterDataByState(
  data: EnhancedMetricsData,
  stateName: string
): MasterDataRecord[] {
  const records = getMasterDataRecords(data);
  return records.filter(record => 
    record.state_name && record.state_name.toLowerCase().includes(stateName.toLowerCase())
  );
}

/**
 * Get master data records for a specific service category
 */
export function getMasterDataByServiceCategory(
  data: EnhancedMetricsData,
  serviceCategory: string
): MasterDataRecord[] {
  const records = getMasterDataRecords(data);
  return records.filter(record => 
    record.service_category && record.service_category.toLowerCase().includes(serviceCategory.toLowerCase())
  );
}

/**
 * Get summary statistics for a specific state
 */
export function getStateSummary(data: EnhancedMetricsData, stateName: string): StateSummary {
  const providerAlerts = getProviderAlertsByState(data, stateName);
  const legislativeUpdates = getLegislativeUpdatesByState(data, stateName);
  const masterDataRecords = getMasterDataByState(data, stateName);
  
  return {
    state: stateName,
    providerAlerts: {
      total: providerAlerts.length,
      new: providerAlerts.filter(alert => alert.is_new === 'yes').length
    },
    legislativeUpdates: {
      total: legislativeUpdates.length,
      new: legislativeUpdates.filter(update => update.is_new === 'yes').length
    },
    masterDataRecords: masterDataRecords.length,
    totalNewAlerts: providerAlerts.filter(alert => alert.is_new === 'yes').length +
                   legislativeUpdates.filter(update => update.is_new === 'yes').length
  };
}

/**
 * Get all available states from the data
 */
export function getAvailableStates(data: EnhancedMetricsData): string[] {
  const states = new Set<string>();
  
  // Get states from provider alerts
  const alerts = getProviderAlerts(data);
  alerts.forEach(alert => {
    if (alert.state) states.add(alert.state);
  });
  
  // Get states from legislative updates
  const updates = getLegislativeUpdates(data);
  updates.forEach(update => {
    if (update.state) states.add(update.state);
  });
  
  // Get states from master data
  const masterRecords = getMasterDataRecords(data);
  masterRecords.forEach(record => {
    if (record.state_name) states.add(record.state_name);
  });
  
  return Array.from(states).sort();
}

/**
 * Get all available service categories from the data
 */
export function getAvailableServiceCategories(data: EnhancedMetricsData): string[] {
  const categories = new Set<string>();
  
  // Get categories from service category list
  const serviceCategories = getServiceCategories(data);
  serviceCategories.forEach(category => {
    if (category.categories) categories.add(category.categories);
  });
  
  // Get categories from master data
  const masterRecords = getMasterDataRecords(data);
  masterRecords.forEach(record => {
    if (record.service_category) categories.add(record.service_category);
  });
  
  return Array.from(categories).sort();
}

// ============================================================================
// RECENT RATE CHANGES FUNCTIONS
// ============================================================================

export interface RecentRateChange {
  id: string;
  serviceCode: string;
  description: string;
  state: string;
  serviceCategory: string;
  oldRate: string;
  newRate: string;
  percentageChange: number;
  effectiveDate: string;
  modifiers: string[];
  providerType: string;
  program: string;
  locationRegion: string;
  durationUnit: string;
}

export interface RecentRateChangesData {
  m: Record<string, Record<string, number>>; // mappings
  v: Record<string, number[]>; // values
  total_records: number;
  date_range: {
    earliest: string;
    latest: string;
  };
  rate_range: {
    min: number;
    max: number;
  };
  states: string[];
  service_categories: string[];
}

/**
 * Decompress a single recent rate change record
 */
export function decompressRecentRateChange(
  data: RecentRateChangesData,
  recordIndex: number
): RecentRateChange | null {
  try {
    const { m: mappings, v: values } = data;
    
    // Helper function to get real value from compressed index
    const getValue = (field: string, index: number): string => {
      const compressedValue = values[field]?.[index];
      if (compressedValue === undefined || compressedValue === -1) return '';
      
      const realValue = Object.keys(mappings[field] || {}).find(
        key => mappings[field][key] === compressedValue
      );
      return realValue || '';
    };
    
    // Helper function to get array of values (for modifiers)
    const getArrayValue = (field: string, index: number): string[] => {
      const compressedArray = values[field]?.[index];
      if (!Array.isArray(compressedArray)) return [];
      
      return compressedArray
        .map(compressedIndex => {
          if (compressedIndex === -1) return '';
          const realValue = Object.keys(mappings[field] || {}).find(
            key => mappings[field][key] === compressedIndex
          );
          return realValue || '';
        })
        .filter(Boolean);
    };
    
    // Decompress all fields
    const serviceCode = getValue('service_code', recordIndex);
    const description = getValue('service_description', recordIndex);
    const state = getValue('state_name', recordIndex);
    const serviceCategory = getValue('service_category', recordIndex);
    const oldRate = getValue('old_rate', recordIndex);
    const newRate = getValue('new_rate', recordIndex);
    const effectiveDate = getValue('effective_date', recordIndex);
    const providerType = getValue('provider_type', recordIndex);
    const program = getValue('program', recordIndex);
    const locationRegion = getValue('location_region', recordIndex);
    const durationUnit = getValue('duration_unit', recordIndex);
    
    // Calculate percentage change
    const oldRateNum = parseFloat(oldRate.replace(/[^0-9.-]/g, '')) || 0;
    const newRateNum = parseFloat(newRate.replace(/[^0-9.-]/g, '')) || 0;
    const percentageChange = oldRateNum > 0 ? ((newRateNum - oldRateNum) / oldRateNum) * 100 : 0;
    
    // Get modifiers (combine all modifier fields)
    const modifiers = [
      ...getArrayValue('modifier_1', recordIndex),
      ...getArrayValue('modifier_2', recordIndex),
      ...getArrayValue('modifier_3', recordIndex),
      ...getArrayValue('modifier_4', recordIndex)
    ].filter(Boolean);
    
    return {
      id: `${serviceCode}-${state}-${effectiveDate}-${recordIndex}`,
      serviceCode,
      description,
      state,
      serviceCategory,
      oldRate,
      newRate,
      percentageChange,
      effectiveDate,
      modifiers,
      providerType,
      program,
      locationRegion,
      durationUnit
    };
  } catch (error) {
    console.error('Error decompressing recent rate change:', error);
    return null;
  }
}

/**
 * Get all recent rate changes
 */
export function getRecentRateChanges(data: RecentRateChangesData): RecentRateChange[] {
  if (!data.v || !data.m) return [];
  
  const totalRecords = data.total_records || 0;
  const changes: RecentRateChange[] = [];
  
  for (let i = 0; i < totalRecords; i++) {
    const change = decompressRecentRateChange(data, i);
    if (change) {
      changes.push(change);
    }
  }
  
  return changes;
}

/**
 * Filter recent rate changes by various criteria
 */
export function filterRecentRateChanges(
  data: RecentRateChangesData,
  filters: {
    state?: string;
    serviceCategory?: string;
    serviceCode?: string;
    providerType?: string;
    program?: string;
    dateRange?: { start: string; end: string };
    percentageRange?: { min: number; max: number };
  }
): RecentRateChange[] {
  const allChanges = getRecentRateChanges(data);
  
  return allChanges.filter(change => {
    // State filter
    if (filters.state && change.state.toLowerCase() !== filters.state.toLowerCase()) {
      return false;
    }
    
    // Service category filter
    if (filters.serviceCategory && change.serviceCategory.toLowerCase() !== filters.serviceCategory.toLowerCase()) {
      return false;
    }
    
    // Service code filter
    if (filters.serviceCode && change.serviceCode !== filters.serviceCode) {
      return false;
    }
    
    // Provider type filter
    if (filters.providerType && change.providerType.toLowerCase() !== filters.providerType.toLowerCase()) {
      return false;
    }
    
    // Program filter
    if (filters.program && change.program.toLowerCase() !== filters.program.toLowerCase()) {
      return false;
    }
    
    // Date range filter
    if (filters.dateRange) {
      const changeDate = new Date(change.effectiveDate);
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      
      if (changeDate < startDate || changeDate > endDate) {
        return false;
      }
    }
    
    // Percentage range filter
    if (filters.percentageRange) {
      if (change.percentageChange < filters.percentageRange.min || 
          change.percentageChange > filters.percentageRange.max) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Get summary statistics for recent rate changes
 */
export function getRecentRateChangesSummary(data: RecentRateChangesData): {
  totalChanges: number;
  averagePercentageChange: number;
  statesWithChanges: number;
  categoriesWithChanges: number;
  dateRange: { start: string; end: string };
  topStates: Array<{ state: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
} {
  const changes = getRecentRateChanges(data);
  
  if (changes.length === 0) {
    return {
      totalChanges: 0,
      averagePercentageChange: 0,
      statesWithChanges: 0,
      categoriesWithChanges: 0,
      dateRange: { start: '', end: '' },
      topStates: [],
      topCategories: []
    };
  }
  
  // Calculate basic stats
  const totalChanges = changes.length;
  const averagePercentageChange = changes.reduce((sum, change) => sum + change.percentageChange, 0) / totalChanges;
  
  // Get unique states and categories
  const states = new Set(changes.map(c => c.state));
  const categories = new Set(changes.map(c => c.serviceCategory));
  
  // Get date range
  const dates = changes.map(c => new Date(c.effectiveDate)).sort((a, b) => a.getTime() - b.getTime());
  const dateRange = {
    start: dates[0].toISOString().split('T')[0],
    end: dates[dates.length - 1].toISOString().split('T')[0]
  };
  
  // Get top states
  const stateCounts = changes.reduce((acc, change) => {
    acc[change.state] = (acc[change.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topStates = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Get top categories
  const categoryCounts = changes.reduce((acc, change) => {
    acc[change.serviceCategory] = (acc[change.serviceCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalChanges,
    averagePercentageChange,
    statesWithChanges: states.size,
    categoriesWithChanges: categories.size,
    dateRange,
    topStates,
    topCategories
  };
}

/**
 * Fetch recent rate changes data from the API
 */
export async function fetchRecentRateChanges(days: number = 30, limit: number = 100, state?: string): Promise<RecentRateChangesData | null> {
  try {
    let url = `/api/recent-rate-changes?days=${days}&limit=${limit}`;
    if (state) {
      url += `&state=${encodeURIComponent(state)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Failed to fetch recent rate changes:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recent rate changes:', error);
    return null;
  }
}
