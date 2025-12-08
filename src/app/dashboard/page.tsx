"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import AppLayout from "@/app/components/applayout";
import { FaExclamationCircle, FaFilter } from 'react-icons/fa';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import Select from 'react-select';
import { useProtectedPage } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import clsx from 'clsx';
import { gunzipSync, strFromU8 } from "fflate";
import { supabase } from "@/lib/supabase";
import { useSubscriptionManagerRedirect } from "@/hooks/useSubscriptionManagerRedirect";
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { fixEncoding } from "@/lib/encoding-fix";
import TemplatesIcon from "@/app/components/TemplatesIcon";
import LoaderOverlay from "@/app/components/LoaderOverlay";

// --- NEW: Types for client-side filtering ---
interface FilterOptionsData {
  filters: {
    [key: string]: string[];
  };
  combinations: Combination[];
}

interface Combination {
  [key: string]: string;
}

type Selections = {
  [key: string]: string | null;
};
// --- END NEW ---

// Removed unused useClickOutside hook - React-select handles dropdown behavior

const FilterNote = ({ step }: { step: number }) => {
  const messages = [
    "Please select a Service Line to begin filtering",
    "Now select a State to continue",
    "Select a Service Code, Service Description, or Fee Schedule Date to complete filtering"
  ];

  // Don't show message if we're past step 3
  if (step > 3) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <p className="text-sm text-blue-700">
        {messages[step - 1]}
      </p>
    </div>
  );
};

// Add this interface near the top of the file with other interfaces
interface RefreshDataResponse {
  data: ServiceData[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  filterOptions: {
    serviceCodes: string[];
    serviceDescriptions: string[];
    programs: string[];
    locationRegions: string[];
    providerTypes: string[];
    modifiers: string[];
  };
}

interface ServiceData {
  state_name: string;
  service_category: string;
  service_code: string;
  service_description?: string;
  modifier_1?: string;
  modifier_1_details?: string;
  modifier_2?: string;
  modifier_2_details?: string;
  modifier_3?: string;
  modifier_3_details?: string;
  modifier_4?: string;
  modifier_4_details?: string;
  rate: string;
  rate_effective_date?: string;
  program: string;
  location_region: string;
  rate_per_hour?: string;
  duration_unit?: string;
  [key: string]: string | undefined;
}

// Add these mappings near the top, after imports and before the Dashboard component
const SERVICE_CATEGORY_ABBREVIATIONS: Record<string, string> = {
  "APPLIED BEHAVIOR ANALYSIS": "ABA",
  "APPLIED BEHAVIORAL ANALYSIS (ABA)": "ABA",
  "BEHAVIORAL HEALTH": "BH",
  "BEHAVIORAL HEALTH AND/OR SUBSTANCE USE DISORDER SERVICES": "BH/SUD",
  "HOME AND COMMUNITY BASED SERVICES": "HCBS",
  // Add more as needed
};

const STATE_ABBREVIATIONS: Record<string, string> = {
  "ALABAMA": "AL",
  "ALASKA": "AK",
  "ARIZONA": "AZ",
  "ARKANSAS": "AR",
  "CALIFORNIA": "CA",
  "COLORADO": "CO",
  "CONNECTICUT": "CT",
  "DELAWARE": "DE",
  "FLORIDA": "FL",
  "GEORGIA": "GA",
  "HAWAII": "HI",
  "IDAHO": "ID",
  "ILLINOIS": "IL",
  "INDIANA": "IN",
  "IOWA": "IA",
  "KANSAS": "KS",
  "KENTUCKY": "KY",
  "LOUISIANA": "LA",
  "MAINE": "ME",
  "MARYLAND": "MD",
  "MASSACHUSETTS": "MA",
  "MICHIGAN": "MI",
  "MINNESOTA": "MN",
  "MISSISSIPPI": "MS",
  "MISSOURI": "MO",
  "MONTANA": "MT",
  "NEBRASKA": "NE",
  "NEVADA": "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  "OHIO": "OH",
  "OKLAHOMA": "OK",
  "OREGON": "OR",
  "PENNSYLVANIA": "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  "TENNESSEE": "TN",
  "TEXAS": "TX",
  "UTAH": "UT",
  "VERMONT": "VT",
  "VIRGINIA": "VA",
  "WASHINGTON": "WA",
  "WEST VIRGINIA": "WV",
  "WISCONSIN": "WI",
  "WYOMING": "WY",
  // Add more if needed
};

// Insert a type alias (Option) near the top (e.g. after imports)
type Option = { value: string; label: string };

// Add this custom filter function before the Dashboard component
const customFilterOption = (option: any, inputValue: string) => {
  const label = option.label.toLowerCase();
  const searchTerm = inputValue.toLowerCase();
  
  // First check if the label starts with the search term
  if (label.startsWith(searchTerm)) {
    return true;
  }
  
  // If no match at start, check if the label contains the search term
  return label.includes(searchTerm);
};

  // Professional Date Picker Component - Enhanced
  const ProfessionalDatePicker = ({
  selected, 
  onChange, 
  placeholder, 
  disabled = false,
  minDate,
  maxDate,
  className = ""
}: {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholder: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(selected ? format(selected, 'MM/dd/yyyy') : '');

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setInputValue(format(date, 'MM/dd/yyyy'));
    } else {
      onChange(null);
      setInputValue('');
    }
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleClear = () => {
    onChange(null);
    setInputValue('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
            disabled ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'
          }`}
          readOnly
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {selected && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg className="w-5 h-5 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 min-w-[280px]">
            {/* Year and Month Selectors */}
            <div className="mb-3 pb-3 border-b border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <select
                    value={selected ? selected.getFullYear() : new Date().getFullYear()}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      const newDate = new Date(selected || new Date());
                      newDate.setFullYear(newYear);
                      onChange(newDate);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: 20 }, (_, i) => {
                      const year = new Date().getFullYear() - 10 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <select
                    value={selected ? selected.getMonth() : new Date().getMonth()}
                    onChange={(e) => {
                      const newMonth = parseInt(e.target.value);
                      const newDate = new Date(selected || new Date());
                      newDate.setMonth(newMonth);
                      onChange(newDate);
                    }}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {[
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                    ].map((month, index) => (
                      <option key={index} value={index}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <DayPicker
              mode="single"
              selected={selected || undefined}
              onSelect={handleDateSelect}
              disabled={disabled}
              fromDate={minDate}
              toDate={maxDate}
              className="rdp"
              showOutsideDays
              fixedWeeks
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium text-gray-900',
                nav: 'space-x-1 flex items-center',
                nav_button: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-muted-foreground rounded-md w-7 font-normal text-[0.7rem]',
                row: 'flex w-full mt-1',
                cell: 'h-7 w-7 text-center text-xs p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
                day: 'h-7 w-7 p-0 font-normal aria-selected:opacity-100',
                day_selected: 'bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white',
                day_today: 'bg-blue-100 text-blue-600 font-semibold',
                day_outside: 'day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30',
                day_disabled: 'text-muted-foreground opacity-50',
                day_range_middle: 'aria-selected:bg-accent aria-selected:text-accent-foreground',
                day_hidden: 'invisible',
              }}
            />
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDateSelect(new Date())}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


// New "jump to first letter" filter function for specific fields
const jumpToLetterFilterOption = (option: any, inputValue: string) => {
  if (!inputValue) return true; // Show all options when no input
  
  const label = option.label.toLowerCase();
  const searchTerm = inputValue.toLowerCase();
  
  // Only match if the label starts with the search term (jump to first letter behavior)
  return label.startsWith(searchTerm);
};

export default function Dashboard() {
  const auth = useProtectedPage();
  const router = useRouter();
  const { isSubscriptionManager, isChecking } = useSubscriptionManagerRedirect();

  // Add local state for data, loading, and error
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All useState hooks
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [authError, setAuthError] = useState<string | null>(null);
  const [filterOptionsData, setFilterOptionsData] = useState<FilterOptionsData | null>(null);
  const [selections, setSelections] = useState<Selections>({
    state_name: null,
    service_category: null,
    service_code: null,
    service_description: null,
    program: null,
    location_region: null,
    provider_type: null,
    duration_unit: null,
    fee_schedule_date: null,
    modifier_1: null,
  });
  const [startDate, setStartDate] = useState<Date | null>(new Date('2017-01-01'));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [isUpdatingFilters, setIsUpdatingFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }[]>([
    { key: 'rate_effective_date', direction: 'desc' }
  ]);
  const [pendingFilters, setPendingFilters] = useState<Set<keyof Selections>>(new Set());
  const [displayedItems, setDisplayedItems] = useState(50); // Adjust this number based on your needs
  const [isTableExpanded, setIsTableExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUsage, setExportUsage] = useState<{
    rowsUsed: number;
    rowsLimit: number;
    rowsRemaining: number;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    canExport: boolean;
  } | null>(null);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [pendingExportRowCount, setPendingExportRowCount] = useState(0);
  const [showCsvWarningModal, setShowCsvWarningModal] = useState(false);
  const [pendingCsvExport, setPendingCsvExport] = useState<{ rowCount: number; proceed: () => void; primaryUserEmail?: string; userRole?: 'subscription_manager' | 'primary_user' | 'sub_user' } | null>(null);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  
  const itemsPerPage = 50; // Adjust this number based on your needs



  const refreshData = async (filters: Record<string, string> = {}): Promise<RefreshDataResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'string') params.append(key, value);
      });
      const url = `/api/state-payment-comparison?${params.toString()}`;
      
      // DEBUG: Log the API URL being called
      console.log('🔍 refreshData - API URL:', url);
      
      const response = await fetch(url);
      
      // DEBUG: Log the response status
      console.log('🔍 refreshData - Response status:', response.status);
      
      const result = await response.json();
      
      // DEBUG: Log the raw API result
      console.log('🔍 refreshData - Raw API result:', result);
      
      if (result && Array.isArray(result.data)) {
        console.log('✅ refreshData - Valid data array received:', result.data.length, 'items');
        setData(result.data);
        return result;
      } else {
        console.log('❌ refreshData - Invalid data format:', result);
        setError('Invalid data format received');
        return null;
      }
    } catch (err) {
      console.error('❌ refreshData - Fetch error:', err);
      setError('Failed to fetch data. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // All useCallback hooks
  const loadFilterOptions = useCallback(async () => {
    if (!filterOptionsData) return;
    
    setIsUpdatingFilters(true);
    try {
      // Build filter conditions based on current selections
      const conditions: ((combo: Combination) => boolean)[] = [];
      
      if (selections.service_category) {
        conditions.push(combo => combo.service_category === selections.service_category);
      }
      
      if (selections.state_name) {
        conditions.push(combo => combo.state_name?.trim().toUpperCase() === selections.state_name?.trim().toUpperCase());
      }
      
      if (selections.service_code) {
        conditions.push(combo => combo.service_code === selections.service_code);
      }
      
      if (selections.service_description) {
        conditions.push(combo => combo.service_description === selections.service_description);
      }
      
      if (selections.program) {
        conditions.push(combo => combo.program === selections.program);
      }
      
      if (selections.location_region) {
        conditions.push(combo => combo.location_region === selections.location_region);
      }
      
      if (selections.provider_type) {
        conditions.push(combo => combo.provider_type === selections.provider_type);
      }
      
      if (selections.duration_unit) {
        conditions.push(combo => combo.duration_unit === selections.duration_unit);
      }
      
      if (selections.modifier_1) {
        conditions.push(combo => combo.modifier_1 === selections.modifier_1);
      }
      
      // Special handling for fee_schedule_date to check if selected date is in the array
      if (selections.fee_schedule_date) {
        conditions.push(combo => {
          if (Array.isArray(combo.rate_effective_date)) {
            return combo.rate_effective_date.includes(selections.fee_schedule_date!);
          }
          return combo.rate_effective_date === selections.fee_schedule_date;
        });
      }
      
      // Filter combinations based on all current selections
      const filteredCombinations = filterOptionsData.combinations.filter(combo => 
        conditions.every(condition => condition(combo))
      );
      
      // Extract unique values for each filter, excluding already selected values
      const states = Array.from(new Set(
        filteredCombinations
          .map(c => c.state_name)
          .filter(Boolean)
          .filter(state => !selections.state_name || state === selections.state_name)
      )).sort();
      
      const serviceCodes = Array.from(new Set(
        filteredCombinations
          .map(c => c.service_code)
          .filter(Boolean)
          .filter(code => !selections.service_code || code === selections.service_code)
      )).sort();
      
      const serviceDescriptions = Array.from(new Set(
        filteredCombinations
          .map(c => c.service_description)
          .filter(Boolean)
          .filter(desc => !selections.service_description || desc === selections.service_description)
      )).sort();
      
      const programs = Array.from(new Set(
        filteredCombinations
          .map(c => c.program)
          .filter(Boolean)
          .filter(program => !selections.program || program === selections.program)
      )).sort();
      
      const locationRegions = Array.from(new Set(
        filteredCombinations
          .map(c => c.location_region)
          .filter(Boolean)
          .filter(region => !selections.location_region || region === selections.location_region)
      )).sort();
      
      const providerTypes = Array.from(new Set(
        filteredCombinations
          .map(c => c.provider_type)
          .filter(Boolean)
          .filter(type => !selections.provider_type || type === selections.provider_type)
      )).sort();
      
      // Special handling for fee schedule dates
      const feeScheduleDates = Array.from(new Set(
        filteredCombinations
          .flatMap(c => {
            if (Array.isArray(c.rate_effective_date)) {
              return c.rate_effective_date.filter(Boolean);
            }
            return c.rate_effective_date ? [c.rate_effective_date] : [];
          })
          .filter(date => !selections.fee_schedule_date || date === selections.fee_schedule_date)
      )).sort();
      
      const modifiers = Array.from(new Set(
        filteredCombinations
          .map(c => c.modifier_1)
          .filter(Boolean)
          .filter(modifier => !selections.modifier_1 || modifier === selections.modifier_1)
      )).sort();
      
      // Update available options
    } catch (error) {
      // Error handling
    } finally {
      setIsUpdatingFilters(false);
    }
  }, [filterOptionsData, selections]);

  const loadStatesForServiceCategory = useCallback(async (serviceCategory: string) => {
    if (!filterOptionsData) return;
    
    setIsUpdatingFilters(true);
    try {
      const states = filterOptionsData.combinations
        .filter(combo => combo.service_category === serviceCategory)
        .map(combo => combo.state_name)
        .filter(Boolean);
      
      const uniqueStates = Array.from(new Set(states)).sort();
    } catch (error) {
      // Error handling
    } finally {
      setIsUpdatingFilters(false);
    }
  }, [filterOptionsData]);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    setHasSearched(true);
    setPendingFilters(new Set());
    try {
      const filters: any = {};
      for (const [key, value] of Object.entries(selections)) {
        // Include "-" values as they represent null/empty filters - these MUST be sent to API
        if (value !== null && value !== undefined) {
          filters[key] = value;
        }
      }
      if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
      if (endDate) filters.end_date = endDate.toISOString().split('T')[0];
      filters.page = String(currentPage);
      filters.itemsPerPage = String(itemsPerPage);
      // modifier_1 is already included in the loop above, but keeping this for backward compatibility
      if (selections.modifier_1) filters.modifier_1 = selections.modifier_1;
      
      // DEBUG: Log the filters being sent
      console.log('🔍 Dashboard Search - Filters being sent:', filters);
      console.log('🔍 Dashboard Search - Current selections:', selections);
      console.log('🔍 Dashboard Search - Provider type value:', selections.provider_type);
      console.log('🔍 Dashboard Search - Is provider_type "-"?:', selections.provider_type === '-');
      
      // Remove sort config from API call since we're doing client-side sorting
      const result = await refreshData(filters) as RefreshDataResponse | null;
      
      // DEBUG: Log the API response
      console.log('🔍 Dashboard Search - API Response:', result);
      console.log('🔍 Dashboard Search - Data array length:', result?.data?.length || 0);
      console.log('🔍 Dashboard Search - Total count:', result?.totalCount || 0);
      
      if (result?.data) {
        console.log('✅ Dashboard Search - Data received:', result.data.length, 'records');
        console.log('🔍 Dashboard Search - First record sample:', result.data[0] || 'No records');
        setTotalCount(result.totalCount);
        setAuthError(null);
      } else {
        console.log('❌ Dashboard Search - No data in response');
        setLocalError('Received invalid data format from server');
      }
    } catch (err) {
      console.error('❌ Dashboard Search - Error:', err);
      setLocalError('Failed to fetch data. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [selections, startDate, endDate, currentPage, itemsPerPage, refreshData]);

  // All useEffect hooks
  // Authentication is now handled by useProtectedPage hook
  
  // Load export usage on mount and when auth changes
  useEffect(() => {
    if (auth.isAuthenticated && auth.isCheckComplete) {
      checkExportUsage();
    }
  }, [auth.isAuthenticated, auth.isCheckComplete]);

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/auth-check');
        if (response.status === 401) {
          router.push("/api/auth/login");
        }
      } catch (error) {
        // Error handling
      }
    };

    const authCheckInterval = setInterval(checkAuthStatus, 5 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (!document.hidden && auth.isAuthenticated) {
        checkAuthStatus();
        
        if (hasSearched && !authError && getAreFiltersApplied()) {
          handleSearch();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(authCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [auth.isAuthenticated, router, hasSearched, authError, handleSearch]);

  useEffect(() => {
    async function loadUltraFilterOptions() {
      try {
        setIsLoadingFilters(true);
        setLocalError(null);
        const res = await fetch("/filter_options.json.gz");
        if (!res.ok) throw new Error(`Failed to fetch filter options: ${res.status} ${res.statusText}`);
        const gzipped = new Uint8Array(await res.arrayBuffer());
        const decompressed = gunzipSync(gzipped);
        const jsonStr = strFromU8(decompressed);
        const data = JSON.parse(jsonStr);
        // Handle new columnar format with mappings
        if (data.m && data.v && data.c) {
          const { m: mappings, v: values, c: columns } = data;
          const numRows: number = values[0].length;
          const combinations: any[] = [];
          for (let i = 0; i < numRows; i++) {
            const combo: Record<string, any> = {};
            columns.forEach((col: string, colIndex: number) => {
              const intValue = values[colIndex][i];
              if (col === 'rate_effective_date') {
                // Handle rate_effective_date as array of integers
                if (Array.isArray(intValue)) {
                  // Convert array of integers to array of date strings
                  combo[col] = intValue.map(dateInt => 
                    dateInt === -1 ? '' : mappings[col][String(dateInt)]
                  ).filter(date => date !== '');
                } else {
                  // Fallback for single integer
                  combo[col] = intValue === -1 ? '' : mappings[col][String(intValue)];
                }
              } else {
                // Handle other fields as single integers
                combo[col] = intValue === -1 ? '' : mappings[col][String(intValue)];
              }
            });
            combinations.push(combo);
          }
          // Extract unique values for each filter
          const filters: Record<string, string[]> = {};
          columns.forEach((col: string) => {
            if (col === 'rate_effective_date') {
              // For dates, flatten arrays and get unique values
              const allDates = combinations
                .map((c: any) => c[col])
                .flat()
                .filter((v: any) => v && v !== '');
              filters[col as string] = [...new Set(allDates)].sort();
            } else {
              // For other fields, get unique single values
              const uniqueValues = [...new Set(combinations.map((c: any) => c[col]).filter((v: any) => v && v !== ''))];
              filters[col as string] = uniqueValues.sort();
            }
          });
          setFilterOptionsData({ filters, combinations });
          

        } else {
          setFilterOptionsData(data);
        }
      } catch (err) {
        setLocalError(`Could not load filter options: ${err instanceof Error ? err.message : 'Unknown error'}. Please try refreshing the page.`);
      } finally {
        setIsLoadingFilters(false);
      }
    }
    loadUltraFilterOptions();
  }, []);

  useEffect(() => {
    if (hasSearched) {
      handleSearch();
    }
    // Only run when currentPage changes, not when hasSearched changes due to filter/sort
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const checkExistingFormData = async (email: string) => {
    try {
      console.log("🔍 Dashboard: Checking for existing form data for email:", email);
      const response = await fetch(`/api/registrationform?email=${encodeURIComponent(email)}`);
      const result = await response.json();

      if (!response.ok) {
        if (response.status !== 404) {
          console.error("❌ Dashboard: Error checking existing form data:", result.error);
        }
        console.log("ℹ️ Dashboard: No existing form data found for email:", email);
        return false;
      } else if (result.data) {
        console.log("✅ Dashboard: Found existing form data for email:", email, result.data);
        return true;
      } else {
        console.log("ℹ️ Dashboard: No existing form data found for email:", email);
        return false;
      }
    } catch (err) {
      console.error("❌ Dashboard: Unexpected error during existing form data check:", err);
      return false;
    }
  };

  // Subscription check is now handled by the centralized AuthContext

  // Generic handler to update selections state
  const handleSelectionChange = (field: keyof Selections, value: string | null) => {
    // Only reset dependent filters if the new selection makes previous selections impossible
    const newSelections: Selections = { ...selections, [field]: value };
    const dependencyChain: (keyof Selections)[] = [
        'service_category', 'state_name', 'service_code', 
        'service_description', 'program', 'location_region', 
        'provider_type', 'duration_unit', 'fee_schedule_date', 'modifier_1'
    ];
    const changedIndex = dependencyChain.indexOf(field);
    if (changedIndex !== -1) {
      for (let i = changedIndex + 1; i < dependencyChain.length; i++) {
        const fieldToClear = dependencyChain[i];
        // Only clear if the current value is not valid for the new selection
        if (selections[fieldToClear] && !getAvailableOptionsForFilter(fieldToClear).includes(selections[fieldToClear]!)) {
        newSelections[fieldToClear] = null;
      }
    }
    }
    // Clear date-based filters if their dependencies change
    if (field === 'service_category' || field === 'state_name') {
      newSelections.fee_schedule_date = null;
      setStartDate(null);
      setEndDate(null);
    }
    setSelections(newSelections);
    setCurrentPage(1);
    // Add to pendingFilters
    setPendingFilters(prev => new Set(prev).add(field));
    setTimeout(() => loadFilterOptions(), 100);
  };

  // Function to check if filters are applied
  const getAreFiltersApplied = () => selections.state_name && selections.service_category && (selections.service_code || selections.service_description || selections.fee_schedule_date || (startDate && endDate));

  // Update the handleSort function
  const handleSort = (key: string, event: React.MouseEvent) => {
    event.preventDefault();
    setSortConfig(prev => {
      const isCtrlPressed = event.ctrlKey;
      const existingSort = prev.find(sort => sort.key === key);
      const existingIndex = prev.findIndex(sort => sort.key === key);
      let newSortConfig: { key: string; direction: 'asc' | 'desc' }[];
      if (existingSort) {
        if (!isCtrlPressed) {
          if (existingSort.direction === 'desc') {
            newSortConfig = prev.filter(sort => sort.key !== key);
          } else {
            newSortConfig = prev.map((sort, i) =>
              i === existingIndex ? { ...sort, direction: (sort.direction === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc' } : sort
            );
          }
        } else if (existingIndex > 0) {
          newSortConfig = prev.map((sort, i) =>
            i === existingIndex ? { ...sort, direction: (sort.direction === 'asc' ? 'desc' : 'asc') as 'asc' | 'desc' } : sort
          );
        } else {
          newSortConfig = prev.filter(sort => sort.key !== key);
        }
      } else {
        const newSort = { key, direction: 'asc' as 'asc' | 'desc' };
        newSortConfig = isCtrlPressed ? [...prev, newSort] : [newSort];
      }
      // Add a special 'sort' key to pendingFilters to indicate sort is pending
      setPendingFilters(prevPending => new Set(prevPending).add('sort' as keyof Selections));
      return newSortConfig;
    });
    const header = event.currentTarget;
    header.classList.add('sort-animation');
    setTimeout(() => {
      header.classList.remove('sort-animation');
    }, 200);
  };

  // Update the SortIndicator component
  const SortIndicator = ({ sortKey }: { sortKey: string }) => {
    const sort = sortConfig.find(sort => sort.key === sortKey);
    if (!sort) return null;
    
    return (
      <span className="ml-1 sort-indicator">
        <span className="arrow" style={{ 
          display: 'inline-block',
          transition: 'transform 0.2s ease',
          transform: sort.direction === 'asc' ? 'rotate(0deg)' : 'rotate(180deg)'
        }}>
          ▲
        </span>
        {sortConfig.length > 1 && (
          <sup className="sort-priority">
            {sortConfig.findIndex(s => s.key === sortKey) + 1}
          </sup>
        )}
      </span>
    );
  };

  // Update ErrorMessage component to handle null
  const ErrorMessage = ({ error }: { error: string | null }) => {
    if (!error) return null;
    
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <div className="flex items-center">
          <FaExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  };

  // All filtering now handled by backend for optimal performance
  // Removed unused dropdown utility functions

  const ClearButton = ({ filterKey }: { filterKey: keyof Selections }) => (
    selections[filterKey] ? (
    <button
        type="button"
        aria-label={`Clear ${filterKey}`}
        onClick={() => handleSelectionChange(filterKey, null)}
        className="ml-1 px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 focus:outline-none filter-clear-btn"
        tabIndex={0}
    >
      Clear
    </button>
    ) : null
  );

  // Update the resetFilters function
  const resetFilters = () => {
    setSelections({
      state_name: null,
      service_category: null,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    setHasSearched(false);
    setSortConfig([]);
    setDisplayedItems(itemsPerPage);
    setData([]);
    setTotalCount(0);
    setError(null);
    setLocalError(null);
    setAuthError(null);
    setPendingFilters(new Set());
    // setFilterOptionsData(null); // Do NOT clear filter options, so the filter UI remains visible
    setIsLoadingFilters(false);
    setIsUpdatingFilters(false);
  };

  // Add pagination controls component
  const PaginationControls = () => {
    if (!hasSearched || totalCount === 0) return null;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    if (totalPages <= 1) return null;
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);
    return (
      <div className="flex flex-col items-center justify-center mt-4">
        <div className="mb-2 text-sm text-gray-700">
          Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of <span className="font-medium">{totalCount}</span> results
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"> {'<<'} </button>
          <button onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1} className="px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"> {'<'} </button>
          <span className="px-3 py-1">Page {currentPage} of {totalPages}</span>
          <button onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages} className="px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"> {'>'} </button>
          <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 rounded hover:bg-blue-100 disabled:opacity-50"> {'>>'} </button>
        </div>
      </div>
    );
  };

  // Helper functions defined before useMemo hooks that use them
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    
    // Handle both YYYY-MM-DD and MM/DD/YYYY formats
    let year: number, month: number, day: number;
    
    if (dateString.includes('/')) {
      // MM/DD/YYYY format
      const [monthStr, dayStr, yearStr] = dateString.split('/');
      month = parseInt(monthStr, 10);
      day = parseInt(dayStr, 10);
      year = parseInt(yearStr, 10);
    } else if (dateString.includes('-')) {
      // YYYY-MM-DD format
      const [yearStr, monthStr, dayStr] = dateString.split('-');
      year = parseInt(yearStr, 10);
      month = parseInt(monthStr, 10);
      day = parseInt(dayStr, 10);
    } else {
      // Fallback to original behavior for unexpected formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    }
    
    // Validate the parsed values
    if (isNaN(year) || isNaN(month) || isNaN(day) || 
        month < 1 || month > 12 || day < 1 || day > 31) {
      return dateString; // Return original if invalid
    }
    
    // Return in MM/DD/YYYY format
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
  };

  // Helper function to create timezone-safe Date objects for DatePicker
  const parseTimezoneNeutralDate = (dateString: string): Date => {
    if (!dateString) return new Date();
    
    let year: number, month: number, day: number;
    
    if (dateString.includes('/')) {
      // MM/DD/YYYY format
      const [monthStr, dayStr, yearStr] = dateString.split('/');
      month = parseInt(monthStr, 10);
      day = parseInt(dayStr, 10);
      year = parseInt(yearStr, 10);
    } else if (dateString.includes('-')) {
      // YYYY-MM-DD format
      const [yearStr, monthStr, dayStr] = dateString.split('-');
      year = parseInt(yearStr, 10);
      month = parseInt(monthStr, 10);
      day = parseInt(dayStr, 10);
    } else {
      // Fallback
      return new Date(dateString);
    }
    
    // Create date in local timezone (month is 0-indexed in Date constructor)
    return new Date(year, month - 1, day);
  };

  // Helper function to format rates with 2 decimal points
  const formatRate = (rate: string | undefined) => {
    if (!rate) return '-';
    // Remove any existing $ and parse as number
    const numericRate = parseFloat(rate.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericRate)) return rate; // Return original if not a valid number
    return `$${numericRate.toFixed(2)}`;
  };

  // After all useState/useEffect/useCallback hooks, but before any useMemo or code that uses available* variables:

  // Add client-side sorting functionality
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) {
      return data;
    }
    return [...data].sort((a, b) => {
      for (const sort of sortConfig) {
        const { key, direction } = sort;
        let aValue: any = a[key];
        let bValue: any = b[key];
        if (key === 'rate') {
          aValue = parseFloat((aValue || '0').replace(/[^0-9.-]/g, ''));
          bValue = parseFloat((bValue || '0').replace(/[^0-9.-]/g, ''));
        } else if (key === 'rate_effective_date') {
          aValue = aValue ? parseTimezoneNeutralDate(aValue).getTime() : 0;
          bValue = bValue ? parseTimezoneNeutralDate(bValue).getTime() : 0;
        } else {
          aValue = (aValue || '').toString().toLowerCase();
          bValue = (bValue || '').toString().toLowerCase();
        }
        if (aValue < bValue) {
          return direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === 'asc' ? 1 : -1;
        }
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Restore handleLoadMore for Load More mode
  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    const filters: any = {};
    for (const [key, value] of Object.entries(selections)) {
      if (value) filters[key] = value;
    }
    if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
    if (endDate) filters.end_date = endDate.toISOString().split('T')[0];
    filters.page = String(nextPage);
    filters.itemsPerPage = String(itemsPerPage);
    setLoading(true);
    const result = await refreshData(filters);
    setLoading(false);
    if (result?.data) {
      setData(prev => [...prev, ...result.data]); // APPEND
      setCurrentPage(nextPage);
      setTotalCount(result.totalCount);
    }
  };

  // Update hasMoreItems logic for Load More mode
  const hasMoreItems = data.length < totalCount;

  // Check Excel export usage
  const checkExportUsage = async () => {
    try {
      const response = await fetch('/api/excel-export/check-usage');
      if (response.ok) {
        const usage = await response.json();
        setExportUsage(usage);
        return usage;
      }
    } catch (error) {
      console.error('Error checking export usage:', error);
    }
    return null;
  };

  // Get primary user email and user role
  const getPrimaryUserInfo = async (): Promise<{ primaryUserEmail: string | null; userRole: 'subscription_manager' | 'primary_user' | 'sub_user' }> => {
    try {
      const response = await fetch('/api/excel-export/check-usage');
      if (response.ok) {
        const data = await response.json();
        return {
          primaryUserEmail: data.primaryUserEmail || null,
          userRole: data.userRole || 'primary_user'
        };
      }
    } catch (error) {
      console.error('Error getting primary user info:', error);
    }
    return { primaryUserEmail: null, userRole: 'primary_user' };
  };

  // Export function to fetch ALL data and convert to Excel with protection
  const handleExportExcel = async () => {
    // Export functionality disabled
    alert('Export functionality is currently disabled.');
    return;
    
    if (!hasSearched || data.length === 0) {
      alert('Please search for data first before exporting.');
      return;
    }

    setIsExporting(true);
    try {
      // Build filters to get total count first
      const filters: Record<string, string> = {};
      for (const [key, value] of Object.entries(selections)) {
        if (value) filters[key] = value;
      }
      if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
      if (endDate) filters.end_date = endDate.toISOString().split('T')[0];

      // Apply sorting if present
      if (sortConfig.length > 0) {
        const sortParts = sortConfig.map(config => `${config.key}:${config.direction}`).join(',');
        filters.sort = sortParts;
      }

      // Get total count first
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'string') params.append(key, value);
      });
      params.append('page', '1');
      params.append('itemsPerPage', '1');
      
      const countResponse = await fetch(`/api/state-payment-comparison?${params.toString()}`);
      if (!countResponse.ok) {
        throw new Error('Failed to get total count');
      }
      const countResult = await countResponse.json();
      const totalRowCount = countResult.totalCount || 0;

      // Check usage and validate
      const usage = await checkExportUsage();
      if (!usage) {
        alert('Failed to check export limits. Please try again.');
        setIsExporting(false);
        return;
      }

      // Check if export is allowed
      if (totalRowCount > usage.rowsRemaining) {
        setPendingExportRowCount(totalRowCount);
        setShowUsageModal(true);
        setIsExporting(false);
        return;
      }

      // Reserve the rows
      const reserveResponse = await fetch('/api/excel-export/check-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowCount: totalRowCount }),
      });

      if (!reserveResponse.ok) {
        const errorData = await reserveResponse.json();
        alert(errorData.message || 'Failed to reserve rows for export. Please try again.');
        setIsExporting(false);
        return;
      }

      const reserveData = await reserveResponse.json();
      if (!reserveData.canExport) {
        alert(reserveData.message || 'Export limit exceeded. Please try again later.');
        setIsExporting(false);
        return;
      }

      // Update usage display
      setExportUsage({
        rowsUsed: reserveData.rowsUsed,
        rowsLimit: reserveData.rowsLimit,
        rowsRemaining: reserveData.rowsRemaining,
        currentPeriodStart: usage.currentPeriodStart,
        currentPeriodEnd: usage.currentPeriodEnd,
        canExport: true,
      });

      // Now fetch all pages of data
      const allData: ServiceData[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const exportPageSize = 1000;

      console.log('📥 Starting Excel export - fetching all pages...');
      
      while (hasMore) {
        const fetchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && typeof value === 'string') fetchParams.append(key, value);
        });
        fetchParams.append('page', String(currentPageNum));
        fetchParams.append('itemsPerPage', String(exportPageSize));
        
        const url = `/api/state-payment-comparison?${fetchParams.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch page ${currentPageNum}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result && Array.isArray(result.data) && result.data.length > 0) {
          allData.push(...result.data);
          console.log(`📥 Fetched page ${currentPageNum}: ${result.data.length} records (Total: ${allData.length})`);
          
          if (allData.length >= (result.totalCount || 0) || result.data.length < exportPageSize) {
            hasMore = false;
          } else {
            currentPageNum++;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Excel export complete: ${allData.length} total records`);

      // Create Excel workbook with ExcelJS (supports password protection)
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'MediRate';
      workbook.created = new Date();

      // Create watermark/notice sheet
      const noticeSheet = workbook.addWorksheet('Notice');
      noticeSheet.getColumn(1).width = 60;
      noticeSheet.getRow(1).getCell(1).value = 'MEDIRATE - PROPRIETARY DATA';
      noticeSheet.getRow(1).getCell(1).font = { bold: true, size: 14 };
      noticeSheet.getRow(2).getCell(1).value = `Copyright © ${new Date().getFullYear()} MediRate. All Rights Reserved.`;
      noticeSheet.getRow(3).getCell(1).value = 'This file contains proprietary and confidential information.';
      noticeSheet.getRow(4).getCell(1).value = 'Unauthorized copying, distribution, or modification is prohibited.';
      noticeSheet.getRow(6).getCell(1).value = `Export Date: ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
      noticeSheet.getRow(7).getCell(1).value = `Total Records: ${allData.length}`;

      // Create main data sheet
      const dataSheet = workbook.addWorksheet('Data');
      
      // Define columns - only specified columns
      dataSheet.columns = [
        { header: 'Service Category', key: 'serviceCategory', width: 20 },
        { header: 'State Name', key: 'stateName', width: 15 },
        { header: 'State Code', key: 'stateCode', width: 10 },
        { header: 'Service Code', key: 'serviceCode', width: 15 },
        { header: 'Service Description', key: 'serviceDescription', width: 40 },
        { header: 'Rate', key: 'rate', width: 18 },
        { header: 'Rate Effective Date', key: 'rateEffectiveDate', width: 15 },
        { header: 'Duration Unit', key: 'durationUnit', width: 15 },
        { header: 'Program', key: 'program', width: 30 },
        { header: 'Modifier 1', key: 'modifier1', width: 15 },
        { header: 'Modifier 1 Details', key: 'modifier1Details', width: 25 },
        { header: 'Modifier 2', key: 'modifier2', width: 15 },
        { header: 'Modifier 2 Details', key: 'modifier2Details', width: 25 },
        { header: 'Modifier 3', key: 'modifier3', width: 15 },
        { header: 'Modifier 3 Details', key: 'modifier3Details', width: 25 },
        { header: 'Modifier 4', key: 'modifier4', width: 15 },
        { header: 'Modifier 4 Details', key: 'modifier4Details', width: 25 },
        { header: 'Fee', key: 'fee', width: 15 },
        { header: 'Max Fee', key: 'maxFee', width: 15 },
        { header: 'Prior Auth Required', key: 'priorAuthRequired', width: 20 },
        { header: 'Location/Region', key: 'locationRegion', width: 25 },
        { header: 'Requires PA', key: 'requiresPa', width: 15 },
        { header: 'Provider Type', key: 'providerType', width: 20 },
        { header: 'Age', key: 'age', width: 10 },
      ];

      // Style header row
      dataSheet.getRow(1).font = { bold: true };
      dataSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      // Add data rows - only specified columns
      allData.forEach(item => {
        const row = dataSheet.addRow({
          serviceCategory: fixEncoding(SERVICE_CATEGORY_ABBREVIATIONS[item.service_category?.toUpperCase() || ""] || item.service_category || ''),
          stateName: fixEncoding(item.state_name || ''),
          stateCode: fixEncoding(item.state_code || STATE_ABBREVIATIONS[item.state_name?.toUpperCase() || ""] || ''),
          serviceCode: fixEncoding(item.service_code || ''),
          serviceDescription: fixEncoding(item.service_description || ''),
          rate: formatRate(item.rate) === '-' ? '' : formatRate(item.rate),
          rateEffectiveDate: formatDate(item.rate_effective_date) === '-' ? '' : formatDate(item.rate_effective_date),
          durationUnit: fixEncoding(item.duration_unit || ''),
          program: fixEncoding(item.program || ''),
          modifier1: fixEncoding(item.modifier_1 || ''),
          modifier1Details: fixEncoding(item.modifier_1_details || ''),
          modifier2: fixEncoding(item.modifier_2 || ''),
          modifier2Details: fixEncoding(item.modifier_2_details || ''),
          modifier3: fixEncoding(item.modifier_3 || ''),
          modifier3Details: fixEncoding(item.modifier_3_details || ''),
          modifier4: fixEncoding(item.modifier_4 || ''),
          modifier4Details: fixEncoding(item.modifier_4_details || ''),
          fee: fixEncoding(item.fee || ''),
          maxFee: fixEncoding(item.max_fee || ''),
          priorAuthRequired: fixEncoding(item.prior_auth_required || ''),
          locationRegion: fixEncoding(item.location_region || ''),
          requiresPa: fixEncoding(item.requires_pa || ''),
          providerType: fixEncoding(item.provider_type || ''),
          age: fixEncoding(item.age || ''),
        });

        // Lock all cells in this row
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.protection = { locked: true };
        });
      });

      // Protect the data sheet with password
      // Password: "MEDIRATE2025" (users will need this to unprotect)
      dataSheet.protect('MEDIRATE2025', {
        selectLockedCells: true,
        selectUnlockedCells: false,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertColumns: false,
        insertRows: false,
        insertHyperlinks: false,
        deleteColumns: false,
        deleteRows: false,
        sort: false,
        autoFilter: false,
        pivotTables: false,
      });

      // Generate Excel file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `MediRate-export-${timestamp}.xlsx`;
      
      // Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Excel export downloaded: ${filename} (${allData.length} records)`);
      console.log(`🔒 Password-protected - Password: MEDIRATE2025`);
      
      // Show success message with usage info
      if (exportUsage) {
        alert(`✅ Export successful!\n\n${allData.length.toLocaleString()} rows exported.\n${exportUsage.rowsRemaining.toLocaleString()} rows remaining in your subscription.`);
      }
      
      setIsExporting(false);
    } catch (err) {
      console.error('❌ Excel export error:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsExporting(false);
    }
  };

  // Export function to fetch ALL data and convert to CSV
  const handleExport = async () => {
    // Export functionality disabled
    alert('Export functionality is currently disabled.');
    return;
    
    if (!hasSearched || data.length === 0) {
      alert('Please search for data first before exporting.');
      return;
    }

    setIsPreparingExport(true);

    // First, get the total row count to show in warning
    try {
      // Build filters from current selections
      const filters: Record<string, string> = {};
      for (const [key, value] of Object.entries(selections)) {
        if (value) filters[key] = value;
      }
      if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
      if (endDate) filters.end_date = endDate.toISOString().split('T')[0];

      // Apply sorting if present
      if (sortConfig.length > 0) {
        const sortParts = sortConfig.map(config => `${config.key}:${config.direction}`).join(',');
        filters.sort = sortParts;
      }

      // Get total count first
      const countParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'string') countParams.append(key, value);
      });
      countParams.append('page', '1');
      countParams.append('itemsPerPage', '1');
      
      const countUrl = `/api/state-payment-comparison?${countParams.toString()}`;
      const countResponse = await fetch(countUrl);
      
      if (!countResponse.ok) {
        throw new Error('Failed to get total count');
      }

      const countResult = await countResponse.json();
      const totalRowCount = countResult.totalCount || 0;

      if (totalRowCount === 0) {
        alert('No data available to export.');
        setIsPreparingExport(false);
        return;
      }

      // Check usage and get primary user info in parallel
      const [usage, primaryUserInfo] = await Promise.all([
        checkExportUsage(),
        getPrimaryUserInfo()
      ]);

      if (!usage) {
        alert('Failed to check export limits. Please try again.');
        setIsPreparingExport(false);
        return;
      }

      // Check if export exceeds limit
      if (totalRowCount > usage.rowsRemaining) {
        setPendingExportRowCount(totalRowCount);
        setShowUsageModal(true);
        setIsPreparingExport(false);
        return;
      }

      // Show warning modal with usage info
      setPendingCsvExport({
        rowCount: totalRowCount,
        proceed: () => performCsvExport(filters, totalRowCount),
        primaryUserEmail: primaryUserInfo.primaryUserEmail || undefined,
        userRole: primaryUserInfo.userRole
      });
      setShowCsvWarningModal(true);
      setIsPreparingExport(false);
    } catch (err) {
      console.error('❌ Error preparing export:', err);
      alert(`Failed to prepare export: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsPreparingExport(false);
    }
  };

  const performCsvExport = async (filters: Record<string, string>, expectedRowCount: number) => {
    setIsExporting(true);
    setShowCsvWarningModal(false);
    
    try {
      // Reserve the rows first
      const reserveResponse = await fetch('/api/excel-export/check-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowCount: expectedRowCount }),
      });

      if (!reserveResponse.ok) {
        const errorData = await reserveResponse.json();
        alert(errorData.message || 'Failed to reserve rows for export. Please try again.');
        setIsExporting(false);
        return;
      }

      const reserveData = await reserveResponse.json();
      if (!reserveData.canExport) {
        alert(reserveData.message || 'Export limit exceeded. Please try again later.');
        setIsExporting(false);
        return;
      }

      // Update usage display
      setExportUsage({
        rowsUsed: reserveData.rowsUsed,
        rowsLimit: reserveData.rowsLimit,
        rowsRemaining: reserveData.rowsRemaining,
        currentPeriodStart: reserveData.currentPeriodStart || '',
        currentPeriodEnd: reserveData.currentPeriodEnd || '',
        canExport: true,
      });

      // Fetch all pages of data
      const allData: ServiceData[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const exportPageSize = 1000; // Larger page size for exports to reduce API calls

      console.log('📥 Starting CSV export - fetching all pages...');
      
      while (hasMore) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value && typeof value === 'string') params.append(key, value);
        });
        params.append('page', String(currentPageNum));
        params.append('itemsPerPage', String(exportPageSize));
        
        const url = `/api/state-payment-comparison?${params.toString()}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch page ${currentPageNum}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result && Array.isArray(result.data) && result.data.length > 0) {
          allData.push(...result.data);
          console.log(`📥 Fetched page ${currentPageNum}: ${result.data.length} records (Total: ${allData.length})`);
          
          // Check if we've fetched all data
          if (allData.length >= (result.totalCount || 0) || result.data.length < exportPageSize) {
            hasMore = false;
          } else {
            currentPageNum++;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`✅ Export complete: ${allData.length} total records`);

      // Convert to CSV
      const headers = [
        'Service Category',
        'State Name',
        'State Code',
        'Service Code',
        'Service Description',
        'Rate',
        'Rate Effective Date',
        'Duration Unit',
        'Program',
        'Modifier 1',
        'Modifier 1 Details',
        'Modifier 2',
        'Modifier 2 Details',
        'Modifier 3',
        'Modifier 3 Details',
        'Modifier 4',
        'Modifier 4 Details',
        'Fee',
        'Max Fee',
        'Prior Auth Required',
        'Location/Region',
        'Requires PA',
        'Provider Type',
        'Age',
      ];

      // Helper function to escape CSV fields
      const escapeCSV = (value: string | null | undefined): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      // Helper function to format rate (returns formatted string, remove $ for CSV if needed, or keep it)
      const formatRateForExport = (rate: string | undefined): string => {
        if (!rate) return '';
        const formatted = formatRate(rate);
        return formatted === '-' ? '' : formatted;
      };

      // Helper function to format date
      const formatDateForExport = (date: string | undefined): string => {
        if (!date) return '';
        const formatted = formatDate(date);
        return formatted === '-' ? '' : formatted;
      };

      // Helper function to format modifier
      const formatModifierForExport = (modifier: string | undefined, details: string | undefined): string => {
        if (!modifier) return '';
        return details ? `${modifier} - ${details}` : modifier;
      };

      // Build CSV rows with MEDIRATE watermark header
      const watermarkHeader = [
        'MEDIRATE - PROPRIETARY DATA',
        'Copyright © ' + new Date().getFullYear() + ' MediRate. All Rights Reserved.',
        'This file contains proprietary and confidential information.',
        'Unauthorized copying, distribution, or modification is prohibited.',
        '', // Empty row separator
        `Export Date: ${new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`,
        `Total Records: ${allData.length}`,
        '', // Empty row separator
      ];
      
      const csvRows = [
        ...watermarkHeader.map(row => escapeCSV(row)),
        headers.join(',')
      ];

      for (const item of allData) {
        const row = [
          escapeCSV(fixEncoding(SERVICE_CATEGORY_ABBREVIATIONS[item.service_category?.toUpperCase() || ""] || item.service_category || '')),
          escapeCSV(fixEncoding(item.state_name || '')),
          escapeCSV(fixEncoding(item.state_code || STATE_ABBREVIATIONS[item.state_name?.toUpperCase() || ""] || '')),
          escapeCSV(fixEncoding(item.service_code || '')),
          escapeCSV(fixEncoding(item.service_description || '')),
          escapeCSV(formatRateForExport(item.rate)),
          escapeCSV(formatDateForExport(item.rate_effective_date)),
          escapeCSV(fixEncoding(item.duration_unit || '')),
          escapeCSV(fixEncoding(item.program || '')),
          escapeCSV(fixEncoding(item.modifier_1 || '')),
          escapeCSV(fixEncoding(item.modifier_1_details || '')),
          escapeCSV(fixEncoding(item.modifier_2 || '')),
          escapeCSV(fixEncoding(item.modifier_2_details || '')),
          escapeCSV(fixEncoding(item.modifier_3 || '')),
          escapeCSV(fixEncoding(item.modifier_3_details || '')),
          escapeCSV(fixEncoding(item.modifier_4 || '')),
          escapeCSV(fixEncoding(item.modifier_4_details || '')),
          escapeCSV(fixEncoding(item.fee || '')),
          escapeCSV(fixEncoding(item.max_fee || '')),
          escapeCSV(fixEncoding(item.prior_auth_required || '')),
          escapeCSV(fixEncoding(item.location_region || '')),
          escapeCSV(fixEncoding(item.requires_pa || '')),
          escapeCSV(fixEncoding(item.provider_type || '')),
          escapeCSV(fixEncoding(item.age || '')),
        ];
        csvRows.push(row.join(','));
      }

      // Add footer watermark
      const watermarkFooter = [
        '', // Empty row separator
        'MEDIRATE - PROPRIETARY DATA',
        'Copyright © ' + new Date().getFullYear() + ' MediRate. All Rights Reserved.',
        'Generated by MediRate Dashboard'
      ];
      
      const csvRowsWithFooter = [
        ...csvRows,
        ...watermarkFooter.map(row => escapeCSV(row))
      ];
      
      const csvContent = csvRowsWithFooter.join('\n');
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `MediRate-export-${timestamp}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ CSV export downloaded: ${filename} (${allData.length} records)`);
      
      // Show success message with usage info
      if (exportUsage) {
        const updatedRemaining = reserveData.rowsRemaining;
        alert(`✅ Export successful!\n\n${allData.length.toLocaleString()} rows exported.\n${updatedRemaining.toLocaleString()} rows remaining in your subscription.`);
      }
      
      setIsExporting(false);
    } catch (err) {
      console.error('❌ Export error:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsExporting(false);
    }
  };



  // Update handlePageChange for Pagination mode
  const handlePageChange = async (page: number) => {
    const filters: any = {};
    for (const [key, value] of Object.entries(selections)) {
      if (value) filters[key] = value;
    }
    if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
    if (endDate) filters.end_date = endDate.toISOString().split('T')[0];
    filters.page = String(page);
    filters.itemsPerPage = String(itemsPerPage);
    setLoading(true);
    const result = await refreshData(filters);
    setLoading(false);
    if (result?.data) {
      setData(result.data); // REPLACE
      setCurrentPage(page);
      setTotalCount(result.totalCount);
    }
  };

  // Helper
  function getAvailableOptionsForFilter(filterKey: keyof Selections) {
    if (!filterOptionsData || !filterOptionsData.combinations) return [];
    
    // Special handling for fee_schedule_date to aggregate dates from the 'rate_effective_date' column
    if (filterKey === 'fee_schedule_date') {
      const dateSet = new Set<string>();
      filterOptionsData.combinations.forEach(combo => {
        // Only check selections that are actually set (not null)
        const matches = Object.entries(selections).every(([key, value]) => {
          if (key === 'fee_schedule_date') return true; // skip current filter
          if (!value) return true; // skip unset selections
          return combo[key] === value;
        });
        if (matches && combo.rate_effective_date) {
          // Handle rate_effective_date as array of dates
          if (Array.isArray(combo.rate_effective_date)) {
            combo.rate_effective_date.forEach(date => {
              if (date) dateSet.add(date);
            });
          } else {
            // Fallback for single date string
            dateSet.add(combo.rate_effective_date);
          }
        }
      });
      return Array.from(dateSet).sort();
    }
    
    // For all other filters, ensure that if a fee_schedule_date is selected, we only consider combos where the date matches
    const availableOptions = Array.from(new Set(
      filterOptionsData.combinations
        .filter(combo => {
          // If a fee_schedule_date is selected, only consider combos where the date matches
          if (selections.fee_schedule_date) {
            if (Array.isArray(combo.rate_effective_date)) {
              if (!combo.rate_effective_date.includes(selections.fee_schedule_date)) return false;
            } else {
              if (combo.rate_effective_date !== selections.fee_schedule_date) return false;
            }
          }
          // Now check all other selections except the current filterKey
          return Object.entries(selections).every(([key, value]) => {
            if (key === filterKey || key === 'fee_schedule_date') return true;
            if (!value) return true;
            
            // Handle multi-select values (comma-separated strings) vs single values (strings)
            if (typeof value === 'string' && value.includes(',')) {
              // Handle comma-separated multi-select values
              const selectedValues = value.split(',').map(v => v.trim());
              return selectedValues.includes(combo[key]);
            } else if (Array.isArray(value)) {
              return value.includes(combo[key]);
            } else {
              return combo[key] === value;
            }
          });
        })
        .map(c => c[filterKey])
        .filter(Boolean)
    ));
    
    // Apply custom sorting for service codes
    if (filterKey === 'service_code') {
      return availableOptions.sort((a: string, b: string) => {
        // Check if both codes are purely numeric
        const isANumeric = /^\d+$/.test(a);
        const isBNumeric = /^\d+$/.test(b);
        
        // If both are numeric, sort numerically
        if (isANumeric && isBNumeric) {
          return parseInt(a, 10) - parseInt(b, 10);
        }
        
        // If only one is numeric, put numeric first
        if (isANumeric && !isBNumeric) {
          return -1; // a comes first
        }
        if (!isANumeric && isBNumeric) {
          return 1; // b comes first
        }
        
        // Check if both are HCPCS codes (start with letter)
        const isAHCPCS = /^[A-Z]\d+$/.test(a);
        const isBHCPCS = /^[A-Z]\d+$/.test(b);
        
        // If both are HCPCS codes, sort alphabetically
        if (isAHCPCS && isBHCPCS) {
          return a.localeCompare(b);
        }
        
        // If only one is HCPCS, put HCPCS first
        if (isAHCPCS && !isBHCPCS) {
          return -1; // a comes first
        }
        if (!isAHCPCS && isBHCPCS) {
          return 1; // b comes first
        }
        
        // Check if both are "number + letter" codes (like 0362T)
        const isANumberLetter = /^\d+[A-Z]$/.test(a);
        const isBNumberLetter = /^\d+[A-Z]$/.test(b);
        
        // If both are number+letter codes, sort numerically by the number part
        if (isANumberLetter && isBNumberLetter) {
          const aNum = parseInt(a.replace(/[A-Z]$/, ''), 10);
          const bNum = parseInt(b.replace(/[A-Z]$/, ''), 10);
          return aNum - bNum;
        }
        
        // If only one is number+letter, put number+letter first
        if (isANumberLetter && !isBNumberLetter) {
          return -1; // a comes first
        }
        if (!isANumberLetter && isBNumberLetter) {
          return 1; // b comes first
        }
        
        // For any other format, sort alphabetically
        return a.localeCompare(b);
      });
    }
    
    return availableOptions.sort();
  }

  // Helper function to check if there are blank entries for a secondary filter
  const hasBlankEntriesForFilter = (filterKey: keyof Selections): boolean => {
    if (!filterOptionsData || !filterOptionsData.combinations) return false;
    
    // Build filter conditions based on current selections (same as getAvailableOptionsForFilter)
    const filteredCombinations = filterOptionsData.combinations.filter(combo => {
      // If a fee_schedule_date is selected, only consider combos where the date matches
      if (selections.fee_schedule_date) {
        if (Array.isArray(combo.rate_effective_date)) {
          if (!combo.rate_effective_date.includes(selections.fee_schedule_date)) return false;
        } else {
          if (combo.rate_effective_date !== selections.fee_schedule_date) return false;
        }
      }
      // Check all other selections except the current filterKey
      return Object.entries(selections).every(([key, value]) => {
        if (key === filterKey || key === 'fee_schedule_date') return true;
        if (!value) return true;
        
        const comboValue = combo[key];
        if (typeof comboValue !== 'string') return true; // Skip non-string fields
        
        // Handle multi-select values (arrays) vs single values (strings)
        if (Array.isArray(value)) {
          return value.includes(String(comboValue));
        } else {
          return comboValue === value;
        }
      });
    });
    
    // Check if there are any entries where the specified field is blank/empty
    return filteredCombinations.some(combo => {
      const fieldValue = combo[filterKey];
      return !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
    });
  };

  // Helper function to build dropdown options with conditional "-" option for secondary filters
  const buildSecondaryFilterOptions = (options: (Option | string)[], filterKey: keyof Selections, withDescriptions: boolean = false): Option[] => {
    const opts: Option[] = options.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
    const hasBlankEntries = hasBlankEntriesForFilter(filterKey);
    
    // Only add "-" option if there are blank entries for this filter (and it's not duration_unit)
    if (hasBlankEntries && filterKey !== 'duration_unit') {
      return [{ value: '-', label: '-' }, ...opts];
    }
    
    return opts;
  };

  // Replace the getDropdownOptions function with the following:
  const getDropdownOptions = (options: (Option | string)[], isMandatory: boolean, filterKey?: keyof Selections): Option[] => {
    // For secondary filters, use the smart logic that checks for blank entries
    if (!isMandatory && filterKey && ['program', 'location_region', 'provider_type', 'modifier_1'].includes(filterKey as string)) {
      return buildSecondaryFilterOptions(options, filterKey);
    }
    
    // For other filters, use the original logic
    const opts: Option[] = options.map(opt => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
    return isMandatory ? opts : [{ value: '-', label: '-' }, ...opts];
  };

  const availableServiceCategories = getAvailableOptionsForFilter('service_category');
  const availableStates = getAvailableOptionsForFilter('state_name');
  const availableServiceCodes = getAvailableOptionsForFilter('service_code');
  const availableServiceDescriptions = getAvailableOptionsForFilter('service_description');
  const availablePrograms = getAvailableOptionsForFilter('program');
  const availableLocationRegions = getAvailableOptionsForFilter('location_region');
  const availableProviderTypes = getAvailableOptionsForFilter('provider_type');
  const availableDurationUnits = getAvailableOptionsForFilter('duration_unit');
  const availableFeeScheduleDates = getAvailableOptionsForFilter('fee_schedule_date');


  // Lazy loading state for duration unit options with counts
  const [durationUnitOptionsWithCounts, setDurationUnitOptionsWithCounts] = useState<{ value: string; label: string }[]>([]);
  const [durationUnitCalculated, setDurationUnitCalculated] = useState(false);
  const [durationUnitCalculationKey, setDurationUnitCalculationKey] = useState('');

  // Create a key to track when we need to recalculate
  const currentCalculationKey = useMemo(() => {
    return JSON.stringify({
      service_category: selections.service_category,
      state_name: selections.state_name,
      service_code: selections.service_code,
      service_description: selections.service_description,
      program: selections.program,
      location_region: selections.location_region,
      provider_type: selections.provider_type,
      fee_schedule_date: selections.fee_schedule_date,
      modifier_1: selections.modifier_1,
      availableDurationUnitsLength: availableDurationUnits.length
    });
  }, [selections, availableDurationUnits.length]);

  // Reset calculation flag when dependencies change
  useEffect(() => {
    if (currentCalculationKey !== durationUnitCalculationKey) {
      setDurationUnitCalculated(false);
    }
  }, [currentCalculationKey, durationUnitCalculationKey]);

  // Function to calculate duration unit options with counts (only called when needed)
  const calculateDurationUnitOptionsWithCounts = useCallback(() => {
    if (!filterOptionsData || !filterOptionsData.combinations || !availableDurationUnits.length) {
      setDurationUnitOptionsWithCounts(availableDurationUnits.map(unit => ({ value: unit, label: unit })));
      setDurationUnitCalculated(true);
      setDurationUnitCalculationKey(currentCalculationKey);
      return;
    }
    
    const optionsWithCounts = availableDurationUnits.map(durationUnit => {
      // Count unique states for this duration unit based on current selections
      const stateCount = new Set(
        filterOptionsData.combinations
          .filter(combo => {
            // Apply current filter conditions (same logic as getAvailableOptionsForFilter)
            if (selections.fee_schedule_date) {
              if (Array.isArray(combo.rate_effective_date)) {
                if (!combo.rate_effective_date.includes(selections.fee_schedule_date)) return false;
              } else {
                if (combo.rate_effective_date !== selections.fee_schedule_date) return false;
              }
            }
            
            // Check all current selections except duration_unit
            const matches = Object.entries(selections).every(([key, value]) => {
              if (key === 'duration_unit' || key === 'fee_schedule_date') return true; // skip current filter
              if (!value) return true; // skip unset selections
              
              if (Array.isArray(value)) {
                return value.includes(combo[key]);
              }
              return combo[key] === value;
            });
            
            return matches && combo.duration_unit === durationUnit;
          })
          .map(combo => combo.state_name)
          .filter(Boolean)
      ).size;
      
      return {
        value: durationUnit,
        label: `${durationUnit} (${stateCount})`
      };
    });
    
    setDurationUnitOptionsWithCounts(optionsWithCounts);
    setDurationUnitCalculated(true);
    setDurationUnitCalculationKey(currentCalculationKey);
  }, [filterOptionsData, availableDurationUnits, selections, currentCalculationKey]);

  // Handler for when duration unit dropdown is opened
  const handleDurationUnitMenuOpen = useCallback(() => {
    if (!durationUnitCalculated || currentCalculationKey !== durationUnitCalculationKey) {
      calculateDurationUnitOptionsWithCounts();
    }
  }, [durationUnitCalculated, currentCalculationKey, durationUnitCalculationKey, calculateDurationUnitOptionsWithCounts]);
  
  // Get modifiers from ALL modifier columns (modifier_1, modifier_2, modifier_3, modifier_4)
  const availableModifiers = useMemo(() => {
    if (!filterOptionsData || !filterOptionsData.combinations) return [];
    
    const modifierSet = new Set<string>();
    
    filterOptionsData.combinations.forEach(combo => {
      // Check if this combination matches current selections (excluding modifier_1)
      const matches = Object.entries(selections).every(([key, value]) => {
        if (key === 'modifier_1' || key === 'fee_schedule_date') return true; // skip current filter
        if (!value) return true; // skip unset selections
        
        // Handle multi-select values (comma-separated strings) vs single values (strings)
        if (typeof value === 'string' && value.includes(',')) {
          const selectedValues = value.split(',').map(v => v.trim());
          return selectedValues.includes(combo[key]);
        } else if (Array.isArray(value)) {
          return value.includes(combo[key]);
        } else {
          return combo[key] === value;
        }
      });
      
      if (matches) {
        // Add modifiers from all columns if they exist
        if (combo.modifier_1) modifierSet.add(combo.modifier_1);
        if (combo.modifier_2) modifierSet.add(combo.modifier_2);
        if (combo.modifier_3) modifierSet.add(combo.modifier_3);
        if (combo.modifier_4) modifierSet.add(combo.modifier_4);
      }
    });
    
    return Array.from(modifierSet).sort();
  }, [filterOptionsData, selections]);

  // Build modifier dropdown options with definitions
  const modifierOptions = useMemo(() => {
    if (!filterOptionsData || !availableModifiers.length) return [];
    const modDefMap = new Map<string, string>();
    
    // First pass: collect all modifier definitions, prioritizing non-empty details
    filterOptionsData.combinations.forEach(c => {
      // Check modifier_1
      if (c.modifier_1) {
        const existing = modDefMap.get(c.modifier_1);
        if (!existing || (c.modifier_1_details && !existing)) {
          modDefMap.set(c.modifier_1, c.modifier_1_details || '');
        }
      }
      
      // Check modifier_2
      if (c.modifier_2) {
        const existing = modDefMap.get(c.modifier_2);
        if (!existing || (c.modifier_2_details && !existing)) {
          modDefMap.set(c.modifier_2, c.modifier_2_details || '');
        }
      }
      
      // Check modifier_3
      if (c.modifier_3) {
        const existing = modDefMap.get(c.modifier_3);
        if (!existing || (c.modifier_3_details && !existing)) {
          modDefMap.set(c.modifier_3, c.modifier_3_details || '');
        }
      }
      
      // Check modifier_4
      if (c.modifier_4) {
        const existing = modDefMap.get(c.modifier_4);
        if (!existing || (c.modifier_4_details && !existing)) {
          modDefMap.set(c.modifier_4, c.modifier_4_details || '');
        }
      }
    });
    
    return availableModifiers.map(mod => ({
      value: mod,
      label: modDefMap.get(mod) ? `${mod} - ${modDefMap.get(mod)}` : mod
    }));
  }, [filterOptionsData, availableModifiers]);

  // Find the current combination based on all selected filters
  const currentCombo = useMemo(() => {
    if (!filterOptionsData || !filterOptionsData.combinations) return null;
    return filterOptionsData.combinations.find(
      c =>
        c.service_category === selections.service_category &&
        c.state_name?.trim().toUpperCase() === selections.state_name?.trim().toUpperCase() &&
        c.service_code === selections.service_code &&
        c.service_description === selections.service_description &&
        c.program === selections.program &&
        c.location_region === selections.location_region &&
        c.provider_type === selections.provider_type &&
        c.duration_unit === selections.duration_unit &&
        c.modifier_1 === selections.modifier_1
    );
  }, [filterOptionsData, selections]);

  // Update the availableDates calculation to use the new helper function
  const availableDates: string[] = useMemo(() => {
    const dates = getAvailableOptionsForFilter('fee_schedule_date');
    return dates.sort((a, b) => parseTimezoneNeutralDate(b).getTime() - parseTimezoneNeutralDate(a).getTime());
  }, [filterOptionsData, selections]);



  // Only after all hooks, do any early returns:
  if (auth.isLoading || auth.shouldRedirect) {
    return <LoaderOverlay />;
  }

  // Debug mode removed - everything is working correctly!

  // Filter options are now handled by the backend API

  // Add this after state declarations
  const isStateSelected = !!selections.state_name && (availableServiceCodes.length > 0 || availableServiceDescriptions.length > 0 || availableFeeScheduleDates.length > 0) && !isLoadingFilters;
  const hasAnyPrimaryFilter =
    !!selections.service_code ||
    !!selections.service_description ||
    (!!startDate && !!endDate) ||
    !!selections.fee_schedule_date;

  // Helper function to add date filters to any filter object
  const addDateFilters = (filters: any) => {
    if (selections.fee_schedule_date) {
      filters.feeScheduleDate = selections.fee_schedule_date;
    } else if (startDate && endDate) {
      filters.startDate = startDate.toISOString().split('T')[0];
      filters.endDate = endDate.toISOString().split('T')[0];
    } else if (startDate) {
      filters.startDate = startDate.toISOString().split('T')[0];
    } else if (endDate) {
      filters.endDate = endDate.toISOString().split('T')[0];
    }
    return filters;
  };

  // Add this handler near other filter handlers
  const handleProviderTypeChange = async (providerType: string) => {
    setSelections({
      state_name: null,
      service_category: null,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: providerType,
      duration_unit: null,
      fee_schedule_date: null,
      modifier_1: null,
    });
    setCurrentPage(1);
  };

  // Simplified date handlers for client-side filtering
  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    // Clear fee schedule date when date range is selected
    if (date) {
      setSelections(prev => ({ ...prev, fee_schedule_date: null }));
    }
    setCurrentPage(1);
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    // Clear fee schedule date when date range is selected
    if (date) {
      setSelections(prev => ({ ...prev, fee_schedule_date: null }));
    }
    setCurrentPage(1);
  };

  const handleFeeScheduleDateChange = (feeScheduleDate: string | null) => {
    setSelections({
      ...selections,
      fee_schedule_date: feeScheduleDate,
    });
    // Clear date range when fee schedule date is selected
    if (feeScheduleDate) {
      setStartDate(null);
      setEndDate(null);
    }
    setCurrentPage(1);
  };

  // Handler for loading templates
  const handleLoadTemplate = (templateData: {
    selections: Record<string, string | null>;
    startDate?: string | null;
    endDate?: string | null;
    sortConfig?: Array<{ key: string; direction: 'asc' | 'desc' }>;
    displayedItems?: number;
  }) => {
    // Load selections
    if (templateData.selections) {
      setSelections(templateData.selections);
    }

    // Load dates
    if (templateData.startDate) {
      setStartDate(new Date(templateData.startDate));
    } else {
      setStartDate(null);
    }
    if (templateData.endDate) {
      setEndDate(new Date(templateData.endDate));
    } else {
      setEndDate(null);
    }

    // Load sort config
    if (templateData.sortConfig) {
      setSortConfig(templateData.sortConfig);
    }

    // Load displayed items
    if (templateData.displayedItems) {
      setDisplayedItems(templateData.displayedItems);
    }

    // Reset to first page
    setCurrentPage(1);
  };

  // 1. Remove Load More logic and button
  // ... existing code ...
  // Remove handleLoadMore, hasMoreItems, and LoadMoreButton
  // ... existing code ...

  // 2. Add handlePageChange for classic pagination
  // ... existing code ...
  // Remove handlePageChange, hasMoreItems, and LoadMoreButton
  // ... existing code ...

  // 4. Table rendering: just use sortedData (which is the current page's data)
  // ... existing code ...

  // Show loading while checking role
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  // If subscription manager, they'll be redirected by the hook
  if (isSubscriptionManager) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <>
      <TemplatesIcon
        onLoadTemplate={handleLoadTemplate}
        currentSelections={selections}
        currentStartDate={startDate}
        currentEndDate={endDate}
        currentSortConfig={sortConfig}
        currentDisplayedItems={displayedItems}
      />
      <AppLayout activeTab="dashboard">
        <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Error Messages */}
        <ErrorMessage error={localError} />
        {authError && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="flex items-center">
              <FaExclamationCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <div>
                <p className="text-yellow-700 font-medium">{authError}</p>
                <button
                  onClick={() => router.push('/api/auth/login')}
                  className="mt-2 px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors text-sm"
                >
                  Sign In Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Heading and Date Range */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-3 sm:mb-0">
            Dashboard
          </h1>
          {/* Date range and Fee Schedule Date selectors OUTSIDE the filter card, styled as in screenshot */}
          <div className="flex flex-col items-end w-full mb-4">
            <div className="flex flex-row gap-6 w-[400px] justify-center">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="block text-sm font-bold text-[#012C61]">Start Date</label>
                <ProfessionalDatePicker
                  selected={startDate}
                  onChange={handleStartDateChange}
                  placeholder="Select start date"
                  disabled={!!selections.fee_schedule_date || !selections.service_category}
                  maxDate={endDate || undefined}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <label className="block text-sm font-bold text-[#012C61]">End Date</label>
                <ProfessionalDatePicker
                  selected={endDate}
                  onChange={handleEndDateChange}
                  placeholder="Select end date"
                  disabled={!!selections.fee_schedule_date || !selections.service_category}
                  minDate={startDate || undefined}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex flex-col items-center w-[400px] mt-4">
              <label className="block text-sm font-bold text-[#012C61] mb-1">Fee Schedule Date</label>
              <Select
                instanceId="fee_schedule_date_select"
                options={availableDates.map(date => ({ value: date, label: formatDate(date) }))}
                value={selections.fee_schedule_date ? { value: selections.fee_schedule_date, label: formatDate(selections.fee_schedule_date) } : null}
                onChange={(option) => handleFeeScheduleDateChange(option?.value || null)}
                placeholder="Select Fee Schedule Date"
                isClearable
                isDisabled={!selections.service_category || !selections.state_name || availableDates.length === 0}
                className={clsx("react-select-container w-full", pendingFilters.has('fee_schedule_date') ? 'pending-outline' : 'applied-outline')}
                classNamePrefix="react-select"
                styles={{
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 999999999,
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 999999999,
                  })
                }}
                menuPortalTarget={typeof window !== 'undefined' ? document.body : undefined}
              />
              <div className="mt-1 w-full text-left">
                <ClearButton filterKey="fee_schedule_date" />
              </div>
            </div>
          </div>
        </div>

        {/* Reset All Filters button above filter card, aligned left */}
        <div className="flex items-center mb-2">
          <button
            onClick={resetFilters}
            className="px-6 py-2 text-sm bg-[#012C61] text-white rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400 font-semibold shadow-sm"
          >
            Reset All Filters
          </button>
        </div>

        {/* Main filter card */}
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg relative z-40">
          {/* Loading indicator for filter options */}
          {isLoadingFilters && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-700">
                  Loading filter options... This may take a moment for large datasets.
                </p>
              </div>
            </div>
          )}
          {!isLoadingFilters && filterOptionsData && (
            <>
              {/* Info message inside filter card */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Instructions:</strong> Select filters below. All filters are interconnected and update dynamically. Click "Search" to view results.
                </p>
              </div>
              {/* Filter updating indicator */}
              {isUpdatingFilters && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700 flex items-center">
                    <span className="animate-spin mr-2">⟳</span>
                    Updating available options...
                  </p>
                </div>
              )}
              {/* Main filter grid below info message */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Service Line
                  </label>
                  <Select
                    instanceId="service_category_select"
                    options={availableServiceCategories.map(o => ({ value: o, label: o }))}
                    value={selections.service_category ? { value: selections.service_category, label: selections.service_category } : null}
                    onChange={(option) => handleSelectionChange('service_category', option?.value || null)}
                    placeholder="Select Service Line"
                    isClearable
                    className={clsx("react-select-container", pendingFilters.has('service_category') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="service_category" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className={clsx(
                    "text-sm font-medium",
                    (!selections.service_category || availableStates.length === 0) ? "text-gray-300" : "text-gray-700"
                  )}>
                    State
                  </label>
                  <Select
                    instanceId="state_name_select"
                    options={availableStates.map(o => ({ value: o, label: o }))}
                    value={selections.state_name ? { value: selections.state_name, label: selections.state_name } : null}
                    onChange={(option) => handleSelectionChange('state_name', option?.value || null)}
                    placeholder="Select State"
                    isClearable
                    isSearchable
                    filterOption={jumpToLetterFilterOption}
                    isDisabled={!selections.service_category || availableStates.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('state_name') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isDisabled ? '#e5e7eb' : 'white',
                        opacity: state.isDisabled ? 0.4 : 1,
                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                        borderColor: state.isDisabled ? '#d1d5db' : provided.borderColor,
                      }),
                      placeholder: (provided, state) => ({
                        ...provided,
                        color: state.isDisabled ? '#9ca3af' : provided.color,
                      }),
                    }}
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="state_name" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className={clsx(
                    "text-sm font-medium",
                    (!selections.service_category || !selections.state_name || availableServiceCodes.length === 0) ? "text-gray-300" : "text-gray-700"
                  )}>
                    Service Code
                  </label>
                  <Select
                    instanceId="service_code_select"
                    options={availableServiceCodes.map(o => ({ value: o, label: o }))}
                    value={selections.service_code ? selections.service_code.split(',').map(code => ({ value: code.trim(), label: code.trim() })) : null}
                    onChange={(options) => handleSelectionChange('service_code', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Service Code(s)"
                    isMulti
                    isClearable
                    isSearchable
                    isDisabled={!selections.service_category || !selections.state_name || availableServiceCodes.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('service_code') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isDisabled ? '#e5e7eb' : 'white',
                        opacity: state.isDisabled ? 0.4 : 1,
                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                        borderColor: state.isDisabled ? '#d1d5db' : provided.borderColor,
                      }),
                      placeholder: (provided, state) => ({
                        ...provided,
                        color: state.isDisabled ? '#9ca3af' : provided.color,
                      }),
                    }}
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="service_code" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className={clsx(
                    "text-sm font-medium",
                    (!selections.service_category || !selections.state_name || availableServiceDescriptions.length === 0) ? "text-gray-300" : "text-gray-700"
                  )}>
                    Service Description
                  </label>
                  <Select
                    instanceId="service_description_select"
                    options={availableServiceDescriptions.map(o => ({ value: o, label: o }))}
                    value={selections.service_description ? { value: selections.service_description, label: selections.service_description } : null}
                    onChange={(option) => handleSelectionChange('service_description', option?.value || null)}
                    placeholder="Select Service Description"
                    isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availableServiceDescriptions.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('service_description') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isDisabled ? '#e5e7eb' : 'white',
                        opacity: state.isDisabled ? 0.4 : 1,
                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                        borderColor: state.isDisabled ? '#d1d5db' : provided.borderColor,
                      }),
                      placeholder: (provided, state) => ({
                        ...provided,
                        color: state.isDisabled ? '#9ca3af' : provided.color,
                      }),
                    }}
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="service_description" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className={clsx(
                    "text-sm font-medium",
                    (!selections.service_category || !selections.state_name || availablePrograms.length === 0) ? "text-gray-300" : "text-gray-700"
                  )}>
                    Program
                  </label>
                  <Select
                    instanceId="program_select"
                    options={getDropdownOptions(availablePrograms, false, 'program')}
                    value={selections.program ? { value: selections.program, label: selections.program } : null}
                    onChange={(option) => handleSelectionChange('program', option ? option.value : null)}
                    placeholder="Select Program"
                    isClearable
                    isSearchable
                    filterOption={jumpToLetterFilterOption}
                    isDisabled={!selections.service_category || !selections.state_name || availablePrograms.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('program') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isDisabled ? '#e5e7eb' : 'white',
                        opacity: state.isDisabled ? 0.4 : 1,
                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                        borderColor: state.isDisabled ? '#d1d5db' : provided.borderColor,
                      }),
                      placeholder: (provided, state) => ({
                        ...provided,
                        color: state.isDisabled ? '#9ca3af' : provided.color,
                      }),
                    }}
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="program" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className={clsx(
                    "text-sm font-medium",
                    (!selections.service_category || !selections.state_name || availableLocationRegions.length === 0) ? "text-gray-300" : "text-gray-700"
                  )}>
                    Location/Region
                  </label>
                  <Select
                    instanceId="location_region_select"
                    options={getDropdownOptions(availableLocationRegions, false, 'location_region')}
                    value={selections.location_region ? selections.location_region.split(',').map(l => ({ value: l.trim(), label: l.trim() })) : null}
                    onChange={(options) => handleSelectionChange('location_region', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Location/Region"
                    isMulti
                    isClearable
                    isSearchable
                    filterOption={jumpToLetterFilterOption}
                    isDisabled={!selections.service_category || !selections.state_name || availableLocationRegions.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('location_region') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isDisabled ? '#e5e7eb' : 'white',
                        opacity: state.isDisabled ? 0.4 : 1,
                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                        borderColor: state.isDisabled ? '#d1d5db' : provided.borderColor,
                      }),
                      placeholder: (provided, state) => ({
                        ...provided,
                        color: state.isDisabled ? '#9ca3af' : provided.color,
                      }),
                    }}
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="location_region" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className={clsx(
                    "text-sm font-medium",
                    (!selections.service_category || !selections.state_name || availableProviderTypes.length === 0) ? "text-gray-300" : "text-gray-700"
                  )}>
                    Provider Type
                  </label>
                  <Select
                    instanceId="provider_type_select"
                    options={getDropdownOptions(availableProviderTypes, false, 'provider_type')}
                    value={selections.provider_type ? selections.provider_type.split(',').map(p => ({ value: p.trim(), label: p.trim() })) : null}
                    onChange={(options) => handleSelectionChange('provider_type', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Provider Type"
                    isMulti
                    isClearable
                    isSearchable
                    filterOption={jumpToLetterFilterOption}
                    isDisabled={!selections.service_category || !selections.state_name || availableProviderTypes.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('provider_type') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isDisabled ? '#e5e7eb' : 'white',
                        opacity: state.isDisabled ? 0.4 : 1,
                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                        borderColor: state.isDisabled ? '#d1d5db' : provided.borderColor,
                      }),
                      placeholder: (provided, state) => ({
                        ...provided,
                        color: state.isDisabled ? '#9ca3af' : provided.color,
                      }),
                    }}
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="provider_type" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className={clsx(
                    "text-sm font-medium",
                    (!selections.service_category || !selections.state_name || availableDurationUnits.length === 0) ? "text-gray-300" : "text-gray-700"
                  )}>
                    Duration Unit
                  </label>
                  <Select
                    instanceId="duration_unit_select"
                    options={getDropdownOptions(
                      durationUnitCalculated 
                        ? durationUnitOptionsWithCounts 
                        : availableDurationUnits.map(unit => ({ value: unit, label: unit })),
                      false
                    )}
                    value={selections.duration_unit ? selections.duration_unit.split(',').map(d => {
                      const trimmedValue = d.trim();
                      const optionWithCount = durationUnitOptionsWithCounts.find(opt => opt.value === trimmedValue);
                      return optionWithCount || { value: trimmedValue, label: trimmedValue };
                    }) : null}
                    onChange={(options) => handleSelectionChange('duration_unit', options ? options.map(opt => opt.value).join(',') : null)}
                    onMenuOpen={handleDurationUnitMenuOpen}
                    placeholder="Select Duration Unit"
                    isMulti
                    isClearable
                    isDisabled={!selections.service_category || !selections.state_name || availableDurationUnits.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('duration_unit') ? 'pending-outline' : 'applied-outline')}
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isDisabled ? '#e5e7eb' : 'white',
                        opacity: state.isDisabled ? 0.4 : 1,
                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                        borderColor: state.isDisabled ? '#d1d5db' : provided.borderColor,
                      }),
                      placeholder: (provided, state) => ({
                        ...provided,
                        color: state.isDisabled ? '#9ca3af' : provided.color,
                      }),
                    }}
                  />
                  <div className="mt-1">
                    <ClearButton filterKey="duration_unit" />
                </div>
                </div>
                <div className="space-y-1">
                  <label className={clsx(
                    "text-sm font-medium",
                    (!selections.service_category || !selections.state_name || availableModifiers.length === 0) ? "text-gray-300" : "text-gray-700"
                  )}>
                    Modifier
                  </label>
                    <Select
                    instanceId="modifier_1_select"
                    options={getDropdownOptions(modifierOptions, false, 'modifier_1')}
                    value={selections.modifier_1 ? selections.modifier_1.split(',').map(m => {
                      const mod = modifierOptions.find(opt => opt.value === m.trim());
                      return mod || { value: m.trim(), label: m.trim() };
                    }) : null}
                    onChange={(options) => handleSelectionChange('modifier_1', options ? options.map(opt => opt.value).join(',') : null)}
                    placeholder="Select Modifier"
                        isMulti
                        isClearable
                        isSearchable
                        filterOption={jumpToLetterFilterOption}
                    isDisabled={!selections.service_category || !selections.state_name || availableModifiers.length === 0}
                    className={clsx("react-select-container", pendingFilters.has('modifier_1') ? 'pending-outline' : 'applied-outline')}
                        classNamePrefix="react-select"
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isDisabled ? '#e5e7eb' : 'white',
                        opacity: state.isDisabled ? 0.4 : 1,
                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                        borderColor: state.isDisabled ? '#d1d5db' : provided.borderColor,
                      }),
                      placeholder: (provided, state) => ({
                        ...provided,
                        color: state.isDisabled ? '#9ca3af' : provided.color,
                      }),
                    }}
                    />
                  <div className="mt-1">
                    <ClearButton filterKey="modifier_1" />
                </div>
                </div>
                </div>
              <div className="mt-6 flex items-center justify-end space-x-4">
                  <button 
                    onClick={handleSearch} 
                    disabled={!selections.state_name || !selections.service_category || isSearching} 
                    className="px-6 py-2 text-sm bg-[#012C61] text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
              </div>
              {/* Current selections summary */}
              {Object.values(selections).some(v => v !== null) && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Current Selections:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selections).map(([key, value]) => 
                      value && (
                        <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {key.replace('_', ' ')}: {value}
                        </span>
                      )
                    )}
                    {startDate && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Start Date: {startDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </span>
                    )}
                    {endDate && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        End Date: {endDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sorting Instructions card below filter card */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center mb-2">
            <span className="text-blue-600 text-xl mr-2">⚡</span>
            <span className="font-semibold text-blue-800">Sorting Instructions</span>
          </div>
          <ul className="list-disc list-inside text-blue-900 text-sm pl-2">
            <li>Click any column header to sort the data</li>
            <li>Click again to toggle between ascending and descending order</li>
            <li>Click a third time to deselect the sort</li>
            <li>Hold <kbd className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded">Ctrl</kbd> while clicking to apply multiple sort levels</li>
            <li>Sort priority is indicated by numbers next to the sort arrows (1 = primary sort, 2 = secondary sort, etc.)</li>
          </ul>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loader-overlay">
            <div className="cssloader">
              <div className="sh1"></div>
              <div className="sh2"></div>
              <h4 className="lt">loading</h4>
            </div>
          </div>
        )}

        {/* Empty State Message */}
        {!loading && !hasSearched && (
          <div className="p-6 bg-white rounded-xl shadow-lg text-center">
            <div className="flex justify-center items-center mb-4">
              <FaFilter className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Please select filters and click Search to view data
            </p>
            <p className="text-sm text-gray-500">
              Start by selecting a Service Line and State.
            </p>
          </div>
        )}

        {/* Show the table when filters are applied and data is loaded */}
        {!loading && hasSearched && data.length > 0 && (
          <>
          {/* Data Summary */}
          <div className="mb-6 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-800">Showing {sortedData.length} of {totalCount} records</span>
              </div>
              {totalCount > 1000 && (
                <div className="text-xs text-gray-500 bg-amber-100 px-2 py-1 rounded">
                  Large dataset detected
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTableExpanded(prev => !prev)}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                title={isTableExpanded ? 'Shrink table' : 'Expand table to full screen'}
              >
                {isTableExpanded ? 'Shrink Table' : 'Expand Table'}
              </button>
            </div>
          </div>
          
          <div 
            className={clsx(
              isTableExpanded 
                ? 'fixed inset-0 z-[1000] bg-white flex flex-col'
                : 'rounded-lg shadow-lg bg-white relative z-30'
            )}
          >
            {isTableExpanded && (
              <div className="flex justify-end p-4 pb-2 border-b border-gray-200 bg-white z-50">
                <button
                  onClick={() => setIsTableExpanded(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                >
                  ✕ Close Full Screen
                </button>
              </div>
            )}
            <div 
              className="overflow-auto flex-1"
              style={{ 
                maxHeight: isTableExpanded ? 'calc(100vh - 4rem)' : 'calc(100vh - 5.5rem)'
              }}
            >
              <table className="min-w-full" style={{ width: '100%', tableLayout: 'auto' }}>
                <thead className="bg-gray-50 sticky top-0 z-40 shadow-sm">
                <tr>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('state_name', e)}>
                    State<SortIndicator sortKey="state_name" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('service_category', e)}>
                    Service Category<SortIndicator sortKey="service_category" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('service_code', e)}>
                    Service Code<SortIndicator sortKey="service_code" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('service_description', e)}>
                    Service Description<SortIndicator sortKey="service_description" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('rate', e)}>
                    Rate per Base Unit<SortIndicator sortKey="rate" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('duration_unit', e)}>
                    Duration Unit<SortIndicator sortKey="duration_unit" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('rate_effective_date', e)}>
                    Effective Date<SortIndicator sortKey="rate_effective_date" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('provider_type', e)}>
                    Provider Type<SortIndicator sortKey="provider_type" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('modifier_1', e)}>
                    Modifier 1<SortIndicator sortKey="modifier_1" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('modifier_2', e)}>
                    Modifier 2<SortIndicator sortKey="modifier_2" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('modifier_3', e)}>
                    Modifier 3<SortIndicator sortKey="modifier_3" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('modifier_4', e)}>
                    Modifier 4<SortIndicator sortKey="modifier_4" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('program', e)}>
                    Program<SortIndicator sortKey="program" />
                    </th>
                    <th className={clsx(
                      'px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider cursor-pointer',
                      pendingFilters.has('sort') ? 'pending-outline' : 'applied-outline'
                    )} onClick={(e) => handleSort('location_region', e)}>
                    Location/Region<SortIndicator sortKey="location_region" />
                    </th>
                </tr>
              </thead>
                                <tbody className="divide-y divide-gray-200">
                  {sortedData.map((item: any, idx: number) => (
                    <tr key={`id-${item.id}-${item.service_code ?? ''}-${item.rate_effective_date ?? ''}-${idx}`}
                        className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fixEncoding(item.state_code || STATE_ABBREVIATIONS[item.state_name?.toUpperCase() || ""] || item.state_name || '-')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fixEncoding(SERVICE_CATEGORY_ABBREVIATIONS[item.service_category?.toUpperCase() || ""] || item.service_category || '-')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fixEncoding(item.service_code || '-')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-[220px] truncate" title={fixEncoding(item.service_description || '-')}>{fixEncoding(item.service_description || '-')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(item.rate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fixEncoding(item.duration_unit || '-')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.rate_effective_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fixEncoding(item.provider_type || '-')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifier_1 ? fixEncoding(item.modifier_1_details ? `${item.modifier_1} - ${item.modifier_1_details}` : item.modifier_1) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifier_2 ? fixEncoding(item.modifier_2_details ? `${item.modifier_2} - ${item.modifier_2_details}` : item.modifier_2) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifier_3 ? fixEncoding(item.modifier_3_details ? `${item.modifier_3} - ${item.modifier_3_details}` : item.modifier_3) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.modifier_4 ? fixEncoding(item.modifier_4_details ? `${item.modifier_4} - ${item.modifier_4_details}` : item.modifier_4) : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fixEncoding(item.program || '-')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fixEncoding(item.location_region || '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
            {/* Always show both controls after a search */}
            <div className="flex flex-col items-center mt-4">
            <PaginationControls />
            </div>
          </>
        )}
      </div>

      {/* Custom CSS for select dropdowns */}
      <style jsx>{`
        select {
          appearance: none;
          background-color: white;
          background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%233b82f6%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 0.75rem;
        }
        select:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
        }
        th.sortable {
          cursor: pointer;
          position: relative;
          user-select: none;
          transition: all 0.2s ease;
          padding: 12px 16px;
        }

        th.sortable:hover {
          background-color: #f5f5f5;
          box-shadow: inset 0 -2px 0 #3b82f6;
        }

        th.sortable.active {
          background-color: #e8f0fe;
          font-weight: 600;
          box-shadow: inset 0 -2px 0 #3b82f6;
        }

        .sort-indicator {
          margin-left: 4px;
          font-size: 0.8em;
          color: #666;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
        }

        th.sortable:hover .sort-indicator {
          color: #3b82f6;
        }

        .sort-priority {
          font-size: 0.6em;
          vertical-align: super;
          color: #3b82f6;
          margin-left: 2px;
          font-weight: 500;
          background-color: #e8f0fe;
          padding: 2px 4px;
          border-radius: 3px;
          transition: all 0.2s ease;
        }

        .arrow {
          transition: transform 0.2s ease;
        }

        .sorted-column {
          background-color: #f8f9fa;
        }

        .sorted-column:hover {
          background-color: #e9ecef;
        }

        .sort-animation {
          animation: sortPulse 0.2s ease;
        }

        @keyframes sortPulse {
          0% { background-color: transparent; }
          50% { background-color: #e8f0fe; }
          100% { background-color: transparent; }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .react-select__menu {
          z-index: 1000;
        }

        .react-datepicker-popper {
          z-index: 1000;
        }

        thead {
          z-index: 50;
          position: sticky;
          top: 0;
        }
      `}</style>
      <style jsx>{`
        .loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(57,57,57,0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }
        .cssloader {
          padding-top: 0;
        }
        .sh1 {
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 50px 50px 0 0;
          border-color: #012C61 transparent transparent transparent;
          margin: 0 auto;
          animation: shk1 1s ease-in-out infinite normal;
        }
        .sh2 {
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 0 50px 50px;
          border-color: transparent  transparent #3b82f6 transparent ;
          margin: -50px auto 0;
          animation: shk2 1s ease-in-out infinite alternate;
        }
        @keyframes shk1 {
          0% { transform: rotate(-360deg); }
          100% {}
        }
        @keyframes shk2 {
          0% { transform: rotate(360deg); }
          100% {}
        }
        .lt {
          color: #bdbdbd;
          font-family: 'Roboto', 'Arial', sans-serif;
          margin: 30px auto;
          text-align: center;
          font-weight: 100;
          letter-spacing: 10px;
          text-transform: lowercase;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <style jsx>{`
        .blue-reset-btn {
          background: #012C61;
          color: #fff;
          font-weight: 600;
          padding: 0.5rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 1rem;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .blue-reset-btn:hover, .blue-reset-btn:focus {
          background: #0141a2;
          box-shadow: 0 2px 8px rgba(1,44,97,0.08);
          outline: none;
        }
      `}</style>
      <style jsx global>{`
        .pending-outline .react-select__control {
          border-color: #FFD600 !important;
          box-shadow: 0 0 0 2px #FFD60033 !important;
        }
        .applied-outline .react-select__control {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px #3b82f633 !important;
        }
        .filter-clear-btn {
          margin-left: 0;
          font-size: 0.8em;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #2563eb;
          border-radius: 0.375rem;
          cursor: pointer;
          padding: 0.1em 0.7em;
          transition: background 0.15s, color 0.15s;
          height: 1.7rem;
          display: inline-flex;
          align-items: center;
        }
        .filter-clear-btn:hover {
          background: #dbeafe;
          color: #1d4ed8;
        }
        .datepicker-zindex {
          z-index: 999999999 !important;
        }
      `}</style>
      </AppLayout>
    </>
  );
}