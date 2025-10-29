"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import AppLayout from "@/app/components/applayout";
import { FaSpinner, FaExclamationCircle, FaChevronLeft, FaChevronRight, FaFilter, FaChartLine } from 'react-icons/fa';
import Select from "react-select";
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

import { useRequireSubscription } from "@/hooks/useRequireAuth";
import { useRouter } from "next/navigation";
import type { Dispatch, SetStateAction } from 'react';
import { gunzipSync, strFromU8 } from "fflate";
import { supabase } from "@/lib/supabase";

interface ServiceData {
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
  rate_effective_date: string;
  program: string;
  location_region: string;
  rate_per_hour?: string;
  duration_unit?: string;
  service_description?: string;
  provider_type?: string;
}

// Helper function to safely parse rates and handle conversion
const parseRate = (rate: string | number | undefined): number => {
  if (typeof rate === 'number') return rate;
  if (typeof rate === 'string') {
    return parseFloat(rate.replace(/[$,]/g, '') || '0');
  }
  return 0;
};

// Helper function to convert rate to hourly based on duration unit
const convertToHourlyRate = (rate: string | number | undefined, durationUnit: string | undefined): number => {
  const rateValue = parseRate(rate);
  const duration = durationUnit?.toUpperCase() || '';
  
  // Convert common duration units to hourly rate
  if (duration.includes('15') && duration.includes('MINUTE')) return rateValue * 4;
  if (duration.includes('30') && duration.includes('MINUTE')) return rateValue * 2;
  if (duration.includes('45') && duration.includes('MINUTE')) return rateValue * (4/3);
  if (duration.includes('60') && duration.includes('MINUTE')) return rateValue;
  if (duration.includes('HOUR')) return rateValue;
  
  // If we can't determine the unit, return the rate as-is
  return rateValue;
};

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Add this custom filter function before the HistoricalRates component
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

// New "jump to first letter" filter function for specific fields
const jumpToLetterFilterOption = (option: any, inputValue: string) => {
  if (!inputValue) return true; // Show all options when no input
  
  const label = option.label.toLowerCase();
  const searchTerm = inputValue.toLowerCase();
  
  // Only match if the label starts with the search term (jump to first letter behavior)
  return label.startsWith(searchTerm);
};

// Move extractFilters above the component definition to avoid linter error
function extractFilters(
  data: ServiceData[],
  setServiceCategories: Dispatch<SetStateAction<string[]>>,
  setStates: Dispatch<SetStateAction<string[]>>,
  setPrograms: Dispatch<SetStateAction<string[]>>,
  setLocationRegions: Dispatch<SetStateAction<string[]>>,
  setModifiers: Dispatch<SetStateAction<{ value: string; label: string; details?: string }[]>>,
  setProviderTypes: Dispatch<SetStateAction<string[]>>
) {
  const categories = data
    .map((item) => item.service_category?.trim())
    .filter((category): category is string => Boolean(category));
  setServiceCategories([...new Set(categories)].sort((a, b) => a.localeCompare(b)));

  const states = data
    .map((item) => item.state_name?.trim().toUpperCase())
    .filter((state): state is string => Boolean(state));
  setStates([...new Set(states)].sort((a, b) => a.localeCompare(b)));

  const programs = data
    .map((item) => item.program?.trim())
    .filter((program): program is string => Boolean(program));
  setPrograms([...new Set(programs)].sort((a, b) => a.localeCompare(b)));

  const locationRegions = data
    .map((item) => item.location_region?.trim())
    .filter((region): region is string => Boolean(region));
  setLocationRegions([...new Set(locationRegions)].sort((a, b) => a.localeCompare(b)));

  const allModifiers = data.flatMap(item => [
    item.modifier_1 ? { value: item.modifier_1, details: item.modifier_1_details } : null,
    item.modifier_2 ? { value: item.modifier_2, details: item.modifier_2_details } : null,
    item.modifier_3 ? { value: item.modifier_3, details: item.modifier_3_details } : null,
    item.modifier_4 ? { value: item.modifier_4, details: item.modifier_4_details } : null
  ]).filter(Boolean);
  setModifiers([...new Set(allModifiers.map(mod => mod?.value).filter(Boolean))].map(value => {
    const mod = allModifiers.find(mod => mod?.value === value);
    return { value: value as string, label: value as string, details: mod?.details || '' };
  }));

  const types = data
    .map((item) => item.provider_type?.trim())
    .filter((type): type is string => Boolean(type));
  setProviderTypes([...new Set(types)].sort((a, b) => a.localeCompare(b)));
}

// Define ErrorMessage component at the top level
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

// Update the CustomTooltip component for better formatting
const CustomTooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [showOnRight, setShowOnRight] = useState(true);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsVisible(true);
    setTimeout(() => {
      if (tooltipRef.current && e.currentTarget) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        // Always show on the right of the cell
        let x = rect.right + 12;
        let y = rect.top;
        // Only clamp if it would go off the window on the left
        if (x < 0) x = 0;
        if (y + tooltipRect.height > window.innerHeight) y = window.innerHeight - tooltipRect.height - 10;
        if (y < 10) y = 10;
        setPosition({ x, y });
        setShowOnRight(true); // Always right
      }
    }, 0);
  };

  const handleMouseLeave = () => setIsVisible(false);

  return (
    <div
      className="relative inline-block w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] px-4 py-2 text-sm text-gray-700 bg-white rounded-lg shadow-lg border border-gray-100 max-w-xl whitespace-pre-line break-words"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            opacity: 1,
            pointerEvents: 'none'
          }}
        >
          <div className="relative">
            {/* Always use left-side arrow */}
            <div className="absolute top-3 left-[-8px] w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45"></div>
            <div className="relative z-10 bg-white rounded-lg whitespace-normal break-words">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add PaginationControls component before the main component
const PaginationControls = ({ 
  currentPage, 
  setCurrentPage, 
  totalCount, 
  itemsPerPage 
}: { 
  currentPage: number; 
  setCurrentPage: (page: number) => void; 
  totalCount: number; 
  itemsPerPage: number; 
}) => {
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const maxVisiblePages = 5;
  const halfVisible = Math.floor(maxVisiblePages / 2);
  
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pages = [];
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      <div className="flex justify-between flex-1 sm:hidden">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalCount)}
            </span>{" "}
            of <span className="font-medium">{totalCount}</span> results
          </p>
        </div>
        <div>
          <nav className="inline-flex -space-x-px rounded-md shadow-sm isolate" aria-label="Pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">First</span>
              <FaChevronLeft className="h-5 w-5" />
              <FaChevronLeft className="h-5 w-5 -ml-2" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Previous</span>
              <FaChevronLeft className="h-5 w-5" />
            </button>
            
            {startPage > 1 && (
              <>
                <button
                  onClick={() => setCurrentPage(1)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    ...
                  </span>
                )}
              </>
            )}

            {pages.map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                  currentPage === page
                    ? "z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                }`}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    ...
                  </span>
                )}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <FaChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Last</span>
              <FaChevronRight className="h-5 w-5" />
              <FaChevronRight className="h-5 w-5 -ml-2" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

// Utility to parse both MM/DD/YYYY and YYYY-MM-DD date strings
function parseDateString(dateStr: string): Date {
  let year: number, month: number, day: number;
  
  if (dateStr.includes('/')) {
    // MM/DD/YYYY format
    [month, day, year] = dateStr.split('/').map(Number);
  } else if (dateStr.includes('-')) {
    // YYYY-MM-DD format
    [year, month, day] = dateStr.split('-').map(Number);
  } else {
    // Fallback - try to parse as is
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    return date;
  }
  
  const result = new Date(year, month - 1, day);
  console.log(`🔍 DATE PARSING: "${dateStr}" -> [${month}, ${day}, ${year}] -> ${result.toISOString()}`);
  return result;
}

// Add a helper for formatting currency
function formatCurrency(value: string | number | undefined): string {
  if (typeof value === 'number') {
    return `$${value.toFixed(2)}`;
  }
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[^0-9.\-]/g, ''));
    if (isNaN(num)) return value;
    return `$${num.toFixed(2)}`;
  }
  return '-';
}

// Add abbreviations mappings (copy from dashboard)
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

// Add this helper function similar to dashboard
const getDropdownOptions = (options: string[], isMandatory: boolean = false, filterKey?: keyof Selections, selections?: Selections, filterOptionsData?: any): { value: string; label: string }[] => {
  const uniqueOptions = [...new Set(options)].filter(Boolean).sort((a, b) => a.localeCompare(b));
  const dropdownOptions = uniqueOptions.map(option => ({
    value: option,
    label: option
  }));
  
  // For secondary filters, check if there are actually blank entries before adding "-" option
  if (!isMandatory && filterKey && selections && filterOptionsData && ['program', 'location_region', 'provider_type', 'modifier_1'].includes(filterKey as string)) {
    const hasBlankEntries = hasBlankEntriesForFilter(filterKey, selections, filterOptionsData);
    if (hasBlankEntries && filterKey !== 'duration_unit') {
      dropdownOptions.unshift({ value: "-", label: "-" });
    }
  } else if (!isMandatory) {
    // For other filters, use the original logic
    dropdownOptions.unshift({ value: "-", label: "-" });
  }
  
  return dropdownOptions;
};

// Add helper to get available options for each filter based on current selections
function getAvailableOptionsForFilter(filterKey: keyof Selections, selections: Selections, filterOptionsData: any): string[] {
  if (!filterOptionsData || !filterOptionsData.combinations) return [];
  
  // For all other filters, ensure that if a fee_schedule_date is selected, we only consider combos where the date is present in the array (or matches the string)
  const availableOptions = Array.from(new Set(
    filterOptionsData.combinations
      .filter((combo: any) => {
        // Now check all other selections except the current filterKey
        return Object.entries(selections).every(([key, value]) => {
          if (key === filterKey) return true;
          if (!value) return true;
          
          // Handle multi-select values (arrays) vs single values (strings)
          if (Array.isArray(value)) {
            return value.includes(combo[key]);
          } else if (typeof value === 'string' && (value.includes(',') || value.includes('|'))) {
            // Handle comma-separated or pipe-separated values (multi-select)
            const separator = value.includes('|') ? '|' : ',';
            const selectedValues = value.split(separator).map(v => v.trim());
            return selectedValues.includes(combo[key]);
          } else {
            return combo[key] === value;
          }
        });
      })
      .map((c: any) => c[filterKey])
      .filter((val: any): val is string => Boolean(val))
  ));
  
  // Apply custom sorting for service codes
  if (filterKey === 'service_code') {
    return (availableOptions as string[]).sort((a: string, b: string) => {
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
  
  return availableOptions.sort() as string[];
}

// Helper function to check if there are blank entries for a secondary filter
const hasBlankEntriesForFilter = (filterKey: keyof Selections, selections: Selections, filterOptionsData: any): boolean => {
  if (!filterOptionsData || !filterOptionsData.combinations) return false;
  
  // Build filter conditions based on current selections (same as getAvailableOptionsForFilter)
  const filteredCombinations = filterOptionsData.combinations.filter((combo: any) => {
    // Check all other selections except the current filterKey
    return Object.entries(selections).every(([key, value]) => {
      if (key === filterKey) return true;
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
  return filteredCombinations.some((combo: any) => {
    const fieldValue = combo[filterKey];
    return !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '');
  });
};


// Add Selections type and state for unified filter management
// --- NEW: Types for client-side filtering ---
interface Combination {
  [key: string]: string;
}

type Selections = {
  [key: string]: string | null;
};

// Add type for multi-state selection
type StateData = {
  state: string;
  data: ServiceData[];
  totalCount: number;
};
// --- END NEW ---

// Add this helper near the top (after imports)
function formatDate(dateString: string | undefined): string {
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
    // Fallback for unexpected formats - use timezone-safe parsing
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
}

export default function HistoricalRates() {
  const auth = useRequireSubscription();
  const router = useRouter();
  
  // Add proper data state management
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Add proper refreshData function
  const refreshData = async (filters: Record<string, string> = {}): Promise<{ data: ServiceData[]; totalCount: number; currentPage: number; itemsPerPage: number } | null> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const url = `/api/state-payment-comparison?${params.toString()}`;
      const response = await fetch(url);
      const result = await response.json();
      if (result && Array.isArray(result.data)) {
        setData(result.data);
        setHasSearched(true);
        return result;
      } else {
        setError('Invalid data format received');
        return null;
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add proper refreshFilters function (placeholder for now)
  const refreshFilters = async () => {
    // This can be implemented later if needed for filter options
  };

  // Function to fetch data for multiple states
  const fetchDataForStates = async (states: string[], filters: Record<string, string> = {}): Promise<StateData[]> => {
    const stateDataResults: StateData[] = [];
    
    for (const state of states) {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        params.append('state_name', state);
        
        const url = `/api/state-payment-comparison?${params.toString()}`;
        const response = await fetch(url, { credentials: 'include' });
        const result = await response.json();
        
        if (result && Array.isArray(result.data)) {
          stateDataResults.push({
            state: state,
            data: result.data,
            totalCount: result.count || result.data.length
          });
        }
      } catch (err) {
        console.error(`Failed to fetch data for state ${state}:`, err);
        // Continue with other states even if one fails
      }
    }
    
    setLoading(false);
    return stateDataResults;
  };

  const [authError, setAuthError] = useState<string | null>(null);

  // Authentication is now handled by useRequireSubscription hook

  // Add pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage: number = 1000;

  // Keep only the states that are still needed
  const [selectedEntry, setSelectedEntry] = useState<ServiceData | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<ServiceData[]>([]);
  const [showRatePerHour, setShowRatePerHour] = useState(false);

  // Color palette for multi-selection - memoized to prevent re-renders
  const colorPalette = useMemo(() => [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280', // Gray
  ], []);
  const [comment, setComment] = useState<string | null>(null);
  const [filterStep, setFilterStep] = useState(1);
  const [shouldExtractFilters, setShouldExtractFilters] = useState(false);
  const [filterOptionsData, setFilterOptionsData] = useState<any>(null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dataQualityWarning, setDataQualityWarning] = useState<string | null>(null);

  // Replace individual filter states with selections state
  const [selections, setSelections] = useState<Selections>({
    service_category: null,
    state_name: null,
    service_code: null,
    service_description: null,
    program: null,
    location_region: null,
    provider_type: null,
    duration_unit: null,
    modifier_1: null,
  });

  // Multi-state selection
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [stateData, setStateData] = useState<StateData[]>([]);
  
  // Chart display options
  const [showLabels, setShowLabels] = useState(true);

  // Lazy loading state for duration unit options with counts
  const [durationUnitOptionsWithCounts, setDurationUnitOptionsWithCounts] = useState<{ value: string; label: string }[]>([]);
  const [durationUnitCalculated, setDurationUnitCalculated] = useState(false);
  const [durationUnitCalculationKey, setDurationUnitCalculationKey] = useState('');

  // Update areFiltersApplied to use selections state
  const areFiltersApplied = selections.service_category && selectedStates.length > 0 && (selections.service_code || selections.service_description);

  // Generic handler to update selections state
  const handleSelectionChange = (field: keyof Selections, value: string | null) => {
    const newSelections: Selections = { ...selections, [field]: value };
    // Reset dependent filters if needed (simple version)
    const dependencyChain: (keyof Selections)[] = [
      'service_category', 'state_name', 'service_code',
      'service_description', 'program', 'location_region',
      'provider_type', 'duration_unit', 'modifier_1'
    ];
    const changedIndex = dependencyChain.indexOf(field);
    if (changedIndex !== -1) {
      for (let i = changedIndex + 1; i < dependencyChain.length; i++) {
        newSelections[dependencyChain[i]] = null;
      }
    }
    setSelections(newSelections);
    setCurrentPage(1); // Reset to first page when filter changes
    
    // Clear selected entry and search state when filters change
    setSelectedEntry(null);
    setHasSearched(false);
    setData([]);
  };

  // Function to add entry to multi-selection
  const addToSelection = useCallback((entry: ServiceData) => {
    setSelectedEntries(prev => {
      // Check if entry already exists
      const exists = prev.some(selected => 
        selected.state_name === entry.state_name &&
        selected.service_category === entry.service_category &&
        selected.service_code === entry.service_code &&
        selected.service_description === entry.service_description &&
        selected.program === entry.program &&
        selected.location_region === entry.location_region &&
        selected.modifier_1 === entry.modifier_1 &&
        selected.modifier_1_details === entry.modifier_1_details &&
        selected.modifier_2 === entry.modifier_2 &&
        selected.modifier_2_details === entry.modifier_2_details &&
        selected.modifier_3 === entry.modifier_3 &&
        selected.modifier_3_details === entry.modifier_3_details &&
        selected.modifier_4 === entry.modifier_4 &&
        selected.modifier_4_details === entry.modifier_4_details &&
        selected.duration_unit === entry.duration_unit &&
        selected.provider_type === entry.provider_type &&
        selected.rate_effective_date === entry.rate_effective_date
      );
      
      if (!exists && prev.length < colorPalette.length) {
        return [...prev, entry];
      }
      return prev;
    });
  }, [colorPalette.length]);

  // Function to remove entry from multi-selection
  const removeFromSelection = useCallback((entry: ServiceData) => {
    setSelectedEntries(prev => prev.filter(selected => 
      !(selected.state_name === entry.state_name &&
        selected.service_category === entry.service_category &&
        selected.service_code === entry.service_code &&
        selected.service_description === entry.service_description &&
        selected.program === entry.program &&
        selected.location_region === entry.location_region &&
        selected.modifier_1 === entry.modifier_1 &&
        selected.modifier_1_details === entry.modifier_1_details &&
        selected.modifier_2 === entry.modifier_2 &&
        selected.modifier_2_details === entry.modifier_2_details &&
        selected.modifier_3 === entry.modifier_3 &&
        selected.modifier_3_details === entry.modifier_3_details &&
        selected.modifier_4 === entry.modifier_4 &&
        selected.modifier_4_details === entry.modifier_4_details &&
        selected.duration_unit === entry.duration_unit &&
        selected.provider_type === entry.provider_type &&
        selected.rate_effective_date === entry.rate_effective_date)
    ));
  }, []);

  // Function to check if entry is in selection
  const isInSelection = useCallback((entry: ServiceData) => {
    return selectedEntries.some(selected => 
      selected.state_name === entry.state_name &&
      selected.service_category === entry.service_category &&
      selected.service_code === entry.service_code &&
      selected.service_description === entry.service_description &&
      selected.program === entry.program &&
      selected.location_region === entry.location_region &&
      selected.modifier_1 === entry.modifier_1 &&
      selected.modifier_1_details === entry.modifier_1_details &&
      selected.modifier_2 === entry.modifier_2 &&
      selected.modifier_2_details === entry.modifier_2_details &&
      selected.modifier_3 === entry.modifier_3 &&
      selected.modifier_3_details === entry.modifier_3_details &&
      selected.modifier_4 === entry.modifier_4 &&
      selected.modifier_4_details === entry.modifier_4_details &&
      selected.duration_unit === entry.duration_unit &&
      selected.provider_type === entry.provider_type &&
      selected.rate_effective_date === entry.rate_effective_date
    );
  }, [selectedEntries]);

  // Function to get color for an entry in selection
  const getSelectionColor = useCallback((entry: ServiceData) => {
    const index = selectedEntries.findIndex(selected => 
      selected.state_name === entry.state_name &&
      selected.service_category === entry.service_category &&
      selected.service_code === entry.service_code &&
      selected.service_description === entry.service_description &&
      selected.program === entry.program &&
      selected.location_region === entry.location_region &&
      selected.modifier_1 === entry.modifier_1 &&
      selected.modifier_1_details === entry.modifier_1_details &&
      selected.modifier_2 === entry.modifier_2 &&
      selected.modifier_2_details === entry.modifier_2_details &&
      selected.modifier_3 === entry.modifier_3 &&
      selected.modifier_3_details === entry.modifier_3_details &&
      selected.modifier_4 === entry.modifier_4 &&
      selected.modifier_4_details === entry.modifier_4_details &&
      selected.duration_unit === entry.duration_unit &&
      selected.provider_type === entry.provider_type &&
      selected.rate_effective_date === entry.rate_effective_date
    );
    return index >= 0 ? colorPalette[index] : null;
  }, [selectedEntries, colorPalette]);

  const filteredData = useMemo(() => {
    // Only show data after a search has been performed
    if (!hasSearched || !selections.service_category || selectedStates.length === 0 || (!selections.service_code && !selections.service_description)) return [];

    console.log('🏁 TABLE DATA SOURCE (filteredData) - Starting with raw data:', data.length, 'entries');

    // First get all matching entries
    const allMatchingEntries = data.filter(item => {
      if (selections.service_category && item.service_category !== selections.service_category) return false;
      if (selectedStates.length > 0 && !selectedStates.some(state => item.state_name?.trim().toUpperCase() === state.trim().toUpperCase())) return false;
      if (selections.service_code && selections.service_code !== '-') {
        // Handle comma-separated service codes
        const selectedCodes = typeof selections.service_code === 'string' 
          ? selections.service_code.split(',').map(code => code.trim())
          : [];
        if (!selectedCodes.includes(item.service_code?.trim() || '')) return false;
      } else if (selections.service_code === '-') {
        if (item.service_code && item.service_code.trim() !== '') return false;
      }
      if (selections.service_description && item.service_description !== selections.service_description) return false;
      if (selections.program && selections.program !== "-") {
        // Handle pipe-separated programs (to avoid splitting on commas within program names)
        const selectedPrograms = typeof selections.program === 'string' 
          ? selections.program.split('|').map(program => program.trim())
          : [];
        if (!selectedPrograms.includes(item.program?.trim() || '')) return false;
      }
      if (selections.location_region && selections.location_region !== "-") {
        // Handle comma-separated location regions
        const selectedRegions = typeof selections.location_region === 'string' 
          ? selections.location_region.split(',').map(region => region.trim())
          : [];
        if (!selectedRegions.includes(item.location_region?.trim() || '')) return false;
      }
      if (selections.modifier_1 && selections.modifier_1 !== "-") {
        // Handle pipe-separated modifiers (to avoid splitting on commas within modifier names)
        const selectedModifiers = typeof selections.modifier_1 === 'string' 
          ? selections.modifier_1.split('|').map(mod => mod.trim())
          : [];
        const hasModifier = selectedModifiers.some(selectedModifier => {
          const selectedModifierCode = selectedModifier.split(' - ')[0];
          return 
            (item.modifier_1?.split(' - ')[0] === selectedModifierCode) ||
            (item.modifier_2?.split(' - ')[0] === selectedModifierCode) ||
            (item.modifier_3?.split(' - ')[0] === selectedModifierCode) ||
            (item.modifier_4?.split(' - ')[0] === selectedModifierCode);
        });
        if (!hasModifier) return false;
      }
      if (selections.provider_type && selections.provider_type !== "-") {
        // Handle comma-separated provider types
        const selectedProviderTypes = typeof selections.provider_type === 'string' 
          ? selections.provider_type.split(',').map(type => type.trim())
          : [];
        if (!selectedProviderTypes.includes(item.provider_type?.trim() || '')) return false;
      }
      if (selections.duration_unit && selections.duration_unit !== "-") {
        // Handle comma-separated duration units
        const selectedUnits = typeof selections.duration_unit === 'string' 
          ? selections.duration_unit.split(',').map(unit => unit.trim())
          : [];
        if (!selectedUnits.includes(item.duration_unit?.trim() || '')) return false;
      }

      // Handle "-" selections (empty/null values)
      if (selections.program === "-" && item.program) return false;
      if (selections.location_region === "-" && item.location_region) return false;
      if (selections.provider_type === "-" && item.provider_type) return false;
      if (selections.duration_unit === "-" && item.duration_unit) return false;
      if (selections.modifier_1 === "-") {
        const hasAnyModifier = item.modifier_1 || item.modifier_2 || item.modifier_3 || item.modifier_4;
        if (hasAnyModifier) return false;
      }

      return true;
    });

    console.log('🏁 TABLE DATA - After filtering:', allMatchingEntries.length, 'entries');
    console.log('🏁 TABLE DATA - Sample filtered entries:', allMatchingEntries.slice(0, 3).map(e => ({ 
      rate: e.rate, 
      date: e.rate_effective_date,
      service_code: e.service_code,
      program: e.program 
    })));

    // Group entries by all fields except rate_effective_date and rate
    const groupedEntries = allMatchingEntries.reduce((acc, entry) => {
      const key = JSON.stringify({
        state_name: entry.state_name,
        service_category: entry.service_category,
        service_code: entry.service_code,
        service_description: entry.service_description,
        program: entry.program,
        location_region: entry.location_region,
        modifier_1: entry.modifier_1,
        modifier_1_details: entry.modifier_1_details,
        modifier_2: entry.modifier_2,
        modifier_2_details: entry.modifier_2_details,
        modifier_3: entry.modifier_3,
        modifier_3_details: entry.modifier_3_details,
        modifier_4: entry.modifier_4,
        modifier_4_details: entry.modifier_4_details,
        duration_unit: entry.duration_unit,
        provider_type: entry.provider_type
      });
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {} as Record<string, ServiceData[]>);

    console.log('🏁 TABLE DATA - Number of groups:', Object.keys(groupedEntries).length);

    // For each group, get the entry with the latest rate_effective_date
    const latestEntries = Object.values(groupedEntries).map(entries => {
      console.log('🏁 TABLE DATA - Group entries:', entries.map(e => ({ 
        rate: e.rate, 
        date: e.rate_effective_date,
        service_code: e.service_code 
      })));
      
      const result = entries.reduce((latest, current) => {
        const latestDate = parseDateString(latest.rate_effective_date);
        const currentDate = parseDateString(current.rate_effective_date);
        const isCurrentNewer = currentDate > latestDate;
        
        console.log(`🏁 TABLE DATA - Comparing dates: ${current.rate_effective_date} (${currentDate.getTime()}) vs ${latest.rate_effective_date} (${latestDate.getTime()}) - Current is newer: ${isCurrentNewer}`);
        
        return isCurrentNewer ? current : latest;
      });
      
      console.log('🏁 TABLE DATA - Selected entry for group:', { 
        rate: result.rate, 
        date: result.rate_effective_date,
        service_code: result.service_code 
      });
      
      return result;
    });

    console.log('🏁 TABLE DATA - Final table data:', latestEntries.length, 'entries');
    console.log('🏁 TABLE DATA - Final entries:', latestEntries.map(e => ({ 
      rate: e.rate, 
      date: e.rate_effective_date,
      service_code: e.service_code,
      program: e.program 
    })));

    return latestEntries;
  }, [
    hasSearched,
    data,
    selections.service_category,
    selectedStates,
    selections.service_code,
    selections.service_description,
    selections.program,
    selections.location_region,
    selections.modifier_1,
    selections.provider_type,
    selections.duration_unit
  ]);

  useEffect(() => {
    // Filtered data processing
  }, [filteredData]);

  const getVisibleColumns = useMemo(() => {
    const columns = {
      state_name: false,
      service_category: false,
      service_code: false,
      service_description: false,
      program: false,
      location_region: false,
      modifier_1: false,
      modifier_2: false,
      modifier_3: false,
      modifier_4: false,
      duration_unit: false,
      rate: false,
      rate_effective_date: false
    };

    // Only process columns if we have data and are not loading
    if (filteredData.length > 0 && !loading) {
      filteredData.forEach(item => {
        Object.keys(columns).forEach(key => {
          if (item[key as keyof ServiceData] && item[key as keyof ServiceData] !== '-') {
            columns[key as keyof typeof columns] = true;
          }
        });
      });
      
      // Ensure essential columns are always visible if we have data
      if (filteredData.length > 0) {
        columns.state_name = true;
        columns.service_category = true;
        columns.service_code = true;
        columns.rate = true;
        columns.rate_effective_date = true;
      }
    }

    return columns;
  }, [filteredData, loading]);

  // Now fetchComment is after all useState hooks
  const fetchComment = async (serviceCategory: string, state: string) => {
    const { data: commentData, error } = await supabase
      .from("comments")
      .select("comment")
      .eq("service_category", serviceCategory)
      .eq("state", state)
      .single();

    if (error) {
      setComment(null);
    } else {
      setComment(commentData?.comment || null);
    }
  };

  // Authentication and subscription checks are now handled by useRequireSubscription hook

  // Add periodic authentication check for long-running sessions
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
        
        if (hasSearched && !authError && areFiltersApplied) {
          // Refresh data if needed
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(authCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [auth.isAuthenticated, router, hasSearched, authError, areFiltersApplied]);

  // Move all useEffect hooks here, before any conditional returns
  useEffect(() => {
    if (shouldExtractFilters) {
      setShouldExtractFilters(false);
    }
  }, [shouldExtractFilters]);

  useEffect(() => {
    if (selections.service_category && selections.state_name) {
      fetchComment(selections.service_category, selections.state_name);
    } else {
      setComment(null);
    }
  }, [selections.service_category, selections.state_name]);

  // Comment out problematic useEffect blocks for now
  /*
  useEffect(() => {
    const descriptions = filteredData.map(item => item.service_description).filter((desc): desc is string => !!desc);
    setServiceDescriptions([...new Set(descriptions)].sort((a, b) => a.localeCompare(b)));

    const programs = filteredData.map(item => item.program).filter((program): program is string => !!program);
    setPrograms([...new Set(programs)].sort((a, b) => a.localeCompare(b)));

    const locationRegions = filteredData.map(item => item.location_region).filter((region): region is string => !!region);
    setLocationRegions([...new Set(locationRegions)].sort((a, b) => a.localeCompare(b)));

    const allModifiers = filteredData.flatMap(item => [
      item.modifier_1 ? { value: item.modifier_1, details: item.modifier_1_details } : null,
      item.modifier_2 ? { value: item.modifier_2, details: item.modifier_2_details } : null,
      item.modifier_3 ? { value: item.modifier_3, details: item.modifier_3_details } : null,
      item.modifier_4 ? { value: item.modifier_4, details: item.modifier_4_details } : null
    ]).filter(Boolean);

    setModifiers([...new Set(allModifiers.map(mod => mod?.value).filter(Boolean))].map(value => {
      const mod = allModifiers.find(mod => mod?.value === value);
      return { value: value as string, label: value as string, details: mod?.details || '' };
    }));
  }, [filteredData]);

  // Preload filter options from context (like dashboard)
  useEffect(() => {
    if (filterOptions?.serviceCategories) {
      setServiceCategories(filterOptions.serviceCategories);
    }
    if (filterOptions?.states) {
      setStates(filterOptions.states);
    }
    // Add other filters as needed
  }, [filterOptions]);
  */

  // Debug: Log filterOptions and selected filters
  useEffect(() => {
    // Filter data processing
  }, [filterOptionsData, selections.service_category, selections.state_name]);

  // Remove duplicate useEffect hooks that call refreshData
  // The pagination useEffect below handles all data fetching

  // Add handleServiceCategoryChange above where it is used
  const handleServiceCategoryChange = async (category: string) => {
    handleSelectionChange('service_category', category);
  };

  // Update handleStateChange to use pagination
  const handleStateChange = async (state: string) => {
    handleSelectionChange('state_name', state);
  };

  // Update handleServiceCodeChange to use pagination
  const handleServiceCodeChange = async (code: string) => {
    handleSelectionChange('service_code', code);
  };

  // Update handleServiceDescriptionChange to use pagination
  const handleServiceDescriptionChange = async (desc: string) => {
    handleSelectionChange('service_description', desc);
  };

  // Add useEffect for pagination
  useEffect(() => {
    if (areFiltersApplied) {
      const filters: Record<string, string> = {};
      if (selections.service_category) filters.service_category = selections.service_category;
      if (selections.state_name) filters.state_name = selections.state_name;
      if (selections.service_code) filters.service_code = selections.service_code; // Already comma-separated from multi-select
      if (selections.service_description) filters.service_description = selections.service_description;
      if (selections.program) filters.program = selections.program;
      if (selections.location_region) filters.location_region = selections.location_region;
      if (selections.provider_type) filters.provider_type = selections.provider_type;
      if (selections.duration_unit) filters.durationUnit = selections.duration_unit;
      if (selections.modifier_1) filters.modifier_1 = selections.modifier_1;
      filters.page = String(currentPage);
      filters.itemsPerPage = String(itemsPerPage);
      
      refreshData(filters).then(result => {
        if (result) {
          setTotalCount(result.totalCount);
        }
      });
    }
  }, [currentPage, areFiltersApplied, selections, itemsPerPage]);

  // Update resetFilters to use selections state
  const resetFilters = async () => {
    setSelections({
      service_category: null,
      state_name: null,
      service_code: null,
      service_description: null,
      program: null,
      location_region: null,
      provider_type: null,
      duration_unit: null,
      modifier_1: null,
    });
    setSelectedEntry(null);
    setCurrentPage(1);
    setTotalCount(0);
    setData([]);
    setError(null);
    setLocalError(null);
    setAuthError(null);
    setHasSearched(false);
    setComment(null);
    if (typeof refreshFilters === 'function') {
      await refreshFilters();
    }
  };

  const formatText = (text: string | undefined) => text || '-';

  // Helper function to format rates with 2 decimal points
  const formatRate = (rate: string | undefined) => {
    if (!rate) return '-';
    // Remove any existing $ and parse as number
    const numericRate = parseRate(rate);
    if (isNaN(numericRate)) return rate; // Return original if not a valid number
    return `$${numericRate.toFixed(2)}`;
  };

  const getGraphData = useMemo(() => {
    if (selectedEntries.length === 0) return { xAxis: [], series: [] };

    console.log('📊 CHART - Generating chart for', selectedEntries.length, 'selected entries');

    const filteredEntries = data.filter((item: ServiceData) => 
      selectedEntries.some(selectedEntry => 
      item.state_name === selectedEntry.state_name &&
      item.service_category === selectedEntry.service_category &&
      (() => {
        // Handle multiple service codes for chart filtering
        if (selectedEntry.service_code && selectedEntry.service_code.includes(',')) {
          const selectedCodes = selectedEntry.service_code.split(',').map(code => code.trim());
          return selectedCodes.includes(item.service_code?.trim() || '');
        } else {
          return item.service_code === selectedEntry.service_code;
        }
      })() &&
      item.service_description === selectedEntry.service_description &&
      item.program === selectedEntry.program &&
      item.location_region === selectedEntry.location_region &&
      item.modifier_1 === selectedEntry.modifier_1 &&
      item.modifier_1_details === selectedEntry.modifier_1_details &&
      item.modifier_2 === selectedEntry.modifier_2 &&
      item.modifier_2_details === selectedEntry.modifier_2_details &&
      item.modifier_3 === selectedEntry.modifier_3 &&
      item.modifier_3_details === selectedEntry.modifier_3_details &&
      item.modifier_4 === selectedEntry.modifier_4 &&
      item.modifier_4_details === selectedEntry.modifier_4_details &&
      item.duration_unit === selectedEntry.duration_unit &&
      item.provider_type === selectedEntry.provider_type
      )
    );
    
    console.log('📊 CHART - Before initial sort, filtered entries:', filteredEntries.map(e => ({ 
      date: e.rate_effective_date, 
      parsed: parseDateString(e.rate_effective_date).toISOString(),
      rate: e.rate 
    })));
    
    const entries = filteredEntries.sort((a, b) => {
      const dateA = parseDateString(a.rate_effective_date);
      const dateB = parseDateString(b.rate_effective_date);
      const result = dateA.getTime() - dateB.getTime();
      console.log(`📊 CHART - Initial sorting: ${a.rate_effective_date} (${dateA.toISOString()}) vs ${b.rate_effective_date} (${dateB.toISOString()}) = ${result}`);
      return result;
    });

    console.log('📊 CHART - Selected Entries for filtering:', selectedEntries.map(entry => ({
      service_description: entry.service_description,
      rate: entry.rate,
      date: entry.rate_effective_date,
      program: entry.program,
      location_region: entry.location_region,
      modifier_1: entry.modifier_1,
      provider_type: entry.provider_type,
      duration_unit: entry.duration_unit
    })));

    console.log('📊 CHART - Found', entries.length, 'matching entries (before deduplication)');
    console.log('📊 CHART - All entries:', entries.map(e => ({ 
      rate: e.rate, 
      date: e.rate_effective_date,
      service_code: e.service_code 
    })));
    
    // Group entries by date to detect and resolve duplicates
    const entriesByDate = entries.reduce((acc, entry) => {
      const date = entry.rate_effective_date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(entry);
      return acc;
    }, {} as Record<string, ServiceData[]>);

    // Detect duplicates and choose the highest rate for each date
    const deduplicatedEntries: ServiceData[] = [];
    let hasDuplicates = false;
    
    Object.entries(entriesByDate).forEach(([date, dateEntries]) => {
      if (dateEntries.length > 1) {
        hasDuplicates = true;
        console.log(`⚠️ DUPLICATE DETECTED for date ${date}:`, dateEntries.map(e => `$${e.rate}`).join(', '));
        // Choose the entry with the highest rate
        const highestRateEntry = dateEntries.reduce((highest, current) => {
          const highestRate = parseRate(highest.rate);
          const currentRate = parseRate(current.rate);
          return currentRate > highestRate ? current : highest;
        });
        deduplicatedEntries.push(highestRateEntry);
        console.log(`✅ Using highest rate: $${highestRateEntry.rate} for ${date}`);
      } else {
        deduplicatedEntries.push(dateEntries[0]);
      }
    });

    // Sort the deduplicated entries by date
    console.log('📊 CHART - Before sorting, entries:', deduplicatedEntries.map(e => ({ 
      date: e.rate_effective_date, 
      parsed: parseDateString(e.rate_effective_date).toISOString(),
      rate: e.rate 
    })));
    
    const finalEntries = deduplicatedEntries.sort((a, b) => {
      const dateA = parseDateString(a.rate_effective_date);
      const dateB = parseDateString(b.rate_effective_date);
      const result = dateA.getTime() - dateB.getTime();
      console.log(`📊 CHART - Sorting: ${a.rate_effective_date} (${dateA.toISOString()}) vs ${b.rate_effective_date} (${dateB.toISOString()}) = ${result}`);
      return result;
    });

    console.log('📊 CHART - After sorting, final entries:', finalEntries.map(e => ({ 
      date: e.rate_effective_date, 
      parsed: parseDateString(e.rate_effective_date).toISOString(),
      rate: e.rate 
    })));
    
    console.log('📊 CHART - After deduplication:', finalEntries.length, 'entries');
    if (hasDuplicates) {
      console.log('⚠️ Data quality issue detected: Multiple rates found for the same date. Using highest rate for each date.');
      setDataQualityWarning('Data quality issue detected: Multiple rates found for the same effective date. Chart shows the highest rate for each date.');
    } else {
      setDataQualityWarning(null);
    }

    // Generate multiple series for each selected entry
    const allDates = new Set<string>();
    const seriesData: any[] = [];
    
    selectedEntries.forEach((selectedEntry, index) => {
      const color = colorPalette[index % colorPalette.length];
      
      // Filter entries for this specific selected entry
      const entriesForThisSelection = filteredEntries.filter((item: ServiceData) => 
        item.state_name === selectedEntry.state_name &&
        item.service_category === selectedEntry.service_category &&
        (() => {
          // Handle multiple service codes for chart filtering
          if (selectedEntry.service_code && selectedEntry.service_code.includes(',')) {
            const selectedCodes = selectedEntry.service_code.split(',').map(code => code.trim());
            return selectedCodes.includes(item.service_code?.trim() || '');
          } else {
            return item.service_code === selectedEntry.service_code;
          }
        })() &&
        item.service_description === selectedEntry.service_description &&
        item.program === selectedEntry.program &&
        item.location_region === selectedEntry.location_region &&
        item.modifier_1 === selectedEntry.modifier_1 &&
        item.modifier_1_details === selectedEntry.modifier_1_details &&
        item.modifier_2 === selectedEntry.modifier_2 &&
        item.modifier_2_details === selectedEntry.modifier_2_details &&
        item.modifier_3 === selectedEntry.modifier_3 &&
        item.modifier_3_details === selectedEntry.modifier_3_details &&
        item.modifier_4 === selectedEntry.modifier_4 &&
        item.modifier_4_details === selectedEntry.modifier_4_details &&
        item.duration_unit === selectedEntry.duration_unit &&
        item.provider_type === selectedEntry.provider_type
      );
      
      // Sort entries by date
      const sortedEntries = entriesForThisSelection.sort((a, b) => {
        const dateA = parseDateString(a.rate_effective_date);
        const dateB = parseDateString(b.rate_effective_date);
        return dateA.getTime() - dateB.getTime();
      });
      
      // Group by date and handle duplicates
      const entriesByDate = sortedEntries.reduce((acc, entry) => {
        const date = entry.rate_effective_date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(entry);
        return acc;
      }, {} as Record<string, ServiceData[]>);
      
      // Create series data for this selection
      const seriesPoints = Object.entries(entriesByDate).map(([date, entries]) => {
        // Use the entry with the highest rate if there are duplicates
        const entry = entries.reduce((max, current) => 
          parseRate(current.rate) > parseRate(max.rate) ? current : max
        );
        
        allDates.add(date);
        
      const rateValue = parseRate(entry.rate);
      const durationUnit = entry.duration_unit?.toUpperCase();
      let value = rateValue;
      let displayValue: string | null = null;

      return {
        value: displayValue ? null : value,
        displayValue,
        state: entry.state_name,
        serviceCode: entry.service_code,
        program: entry.program,
        locationRegion: entry.location_region,
        durationUnit: entry.duration_unit,
        date: entry.rate_effective_date,
        modifier1: entry.modifier_1,
        modifier1Details: entry.modifier_1_details,
        modifier2: entry.modifier_2,
        modifier2Details: entry.modifier_2_details,
        modifier3: entry.modifier_3,
        modifier3Details: entry.modifier_3_details,
        modifier4: entry.modifier_4,
        modifier4Details: entry.modifier_4_details
      };
    });

      // Add extension to current date if there are data points
      if (seriesPoints.length > 0) {
        // Get the latest data point
        const latestPoint = seriesPoints[seriesPoints.length - 1];
        const latestDate = parseDateString(latestPoint.date);
        const currentDate = new Date();
        
        // Only extend if the latest date is not today
        if (latestDate.toDateString() !== currentDate.toDateString()) {
          // Format current date to match the data format
          const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          
          // Add extension point to current date with same rate as latest point
          seriesPoints.push({
            value: latestPoint.value,
            displayValue: latestPoint.displayValue,
            state: latestPoint.state,
            serviceCode: latestPoint.serviceCode,
            program: latestPoint.program,
            locationRegion: latestPoint.locationRegion,
            durationUnit: latestPoint.durationUnit,
            date: currentDateStr,
            modifier1: latestPoint.modifier1,
            modifier1Details: latestPoint.modifier1Details,
            modifier2: latestPoint.modifier2,
            modifier2Details: latestPoint.modifier2Details,
            modifier3: latestPoint.modifier3,
            modifier3Details: latestPoint.modifier3Details,
            modifier4: latestPoint.modifier4,
            modifier4Details: latestPoint.modifier4Details,
            isExtended: true // Mark this as an extended point
          } as any);
          
          // Add current date to all dates set
          allDates.add(currentDateStr);
        }
      }

      seriesData.push({
        data: seriesPoints,
        color: color,
        name: `${selectedEntry.state_name} - ${selectedEntry.service_description || selectedEntry.service_code}`
      });
    });
    
    // Create xAxis from all unique dates
    const xAxis = Array.from(allDates).sort((a, b) => {
      const dateA = parseDateString(a);
      const dateB = parseDateString(b);
      return dateA.getTime() - dateB.getTime();
    });

    return { xAxis, series: seriesData };
  }, [selectedEntries, data, showRatePerHour, colorPalette]);

  // Derived loading state for service code options
  const serviceCodeOptionsLoading =
    loading ||
    (!!selections.service_category && !!selections.state_name && (!filterOptionsData || !filterOptionsData.combinations || filterOptionsData.combinations.length === 0));

  // Use filteredData as tableData to ensure consistency
  const tableData = filteredData;

  // Add this handler near other filter handlers
  const handleProviderTypeChange = async (providerType: string) => {
    handleSelectionChange('provider_type', providerType);
  };

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
            const combo: Record<string, string> = {};
            columns.forEach((col: string, colIndex: number) => {
              const intValue = values[colIndex][i];
              combo[col] = intValue === -1 ? '' : mappings[col][intValue];
            });
            combinations.push(combo);
          }
          // Extract unique values for each filter
          const filters: Record<string, string[]> = {};
          columns.forEach((col: string) => {
            const uniqueValues = [...new Set(combinations.map((c: any) => c[col]).filter((v: string) => v))];
            filters[col as string] = uniqueValues.sort();
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


  // Add available options variables like dashboard
  const availableServiceCategories = getAvailableOptionsForFilter('service_category', selections, filterOptionsData) as string[];
  const availableStates = getAvailableOptionsForFilter('state_name', selections, filterOptionsData) as string[];
  const availableServiceCodes = getAvailableOptionsForFilter('service_code', selections, filterOptionsData) as string[];
  const availableServiceDescriptions = getAvailableOptionsForFilter('service_description', selections, filterOptionsData) as string[];
  const availablePrograms = getAvailableOptionsForFilter('program', selections, filterOptionsData) as string[];
  const availableLocationRegions = getAvailableOptionsForFilter('location_region', selections, filterOptionsData) as string[];
  const availableProviderTypes = getAvailableOptionsForFilter('provider_type', selections, filterOptionsData) as string[];
  const availableDurationUnits = getAvailableOptionsForFilter('duration_unit', selections, filterOptionsData) as string[];
  
  // Get modifiers from ALL modifier columns (modifier_1, modifier_2, modifier_3, modifier_4)
  const availableModifiers = useMemo(() => {
    if (!filterOptionsData || !filterOptionsData.combinations) return [];
    
    const modifierSet = new Set<string>();
    
    filterOptionsData.combinations.forEach((combo: any) => {
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

  // Create a key to track when we need to recalculate duration unit counts
  const getCurrentCalculationKey = useMemo(() => {
    return JSON.stringify({
      service_category: selections.service_category,
      state_name: selections.state_name,
      service_code: selections.service_code,
      service_description: selections.service_description,
      program: selections.program,
      location_region: selections.location_region,
      provider_type: selections.provider_type,
      modifier_1: selections.modifier_1,
      availableDurationUnitsLength: availableDurationUnits.length
    });
  }, [selections, availableDurationUnits.length]);

  // Function to calculate duration unit options with counts (only called when needed)
  const calculateDurationUnitOptionsWithCounts = useCallback(() => {
    if (!filterOptionsData || !filterOptionsData.combinations || !availableDurationUnits.length) {
      setDurationUnitOptionsWithCounts(availableDurationUnits.map(unit => ({ value: unit, label: unit })));
      setDurationUnitCalculated(true);
      setDurationUnitCalculationKey(getCurrentCalculationKey);
      return;
    }
    
    const optionsWithCounts = availableDurationUnits.map(durationUnit => {
      // Count unique states for this duration unit based on current selections
      const stateCount = new Set(
        filterOptionsData.combinations
          .filter((combo: any) => {
            // Apply current filter conditions (same logic as getAvailableOptionsForFilter)
            if (selections.service_category && combo.service_category !== selections.service_category) return false;
            if (selections.state_name && combo.state_name !== selections.state_name) return false;
            if (selections.service_code && combo.service_code !== selections.service_code) return false;
            if (selections.service_description && combo.service_description !== selections.service_description) return false;
            if (selections.program && selections.program !== "-" && combo.program !== selections.program) return false;
            if (selections.location_region && selections.location_region !== "-" && combo.location_region !== selections.location_region) return false;
            if (selections.provider_type && selections.provider_type !== "-" && combo.provider_type !== selections.provider_type) return false;
            if (selections.modifier_1 && selections.modifier_1 !== "-" && combo.modifier_1 !== selections.modifier_1) return false;
            
            return combo.duration_unit === durationUnit;
          })
          .map((combo: any) => combo.state_name)
          .filter(Boolean)
      ).size;
      
      return {
        value: durationUnit,
        label: `${durationUnit} (${stateCount})`
      };
    });
    
    setDurationUnitOptionsWithCounts(optionsWithCounts);
    setDurationUnitCalculated(true);
    setDurationUnitCalculationKey(getCurrentCalculationKey);
  }, [filterOptionsData, availableDurationUnits, selections, getCurrentCalculationKey]);

  // Reset calculation flag when dependencies change
  useEffect(() => {
    if (getCurrentCalculationKey !== durationUnitCalculationKey) {
      setDurationUnitCalculated(false);
    }
  }, [getCurrentCalculationKey, durationUnitCalculationKey]);

  // Handler for when duration unit dropdown is opened
  const handleDurationUnitMenuOpen = useCallback(() => {
    if (!durationUnitCalculated || getCurrentCalculationKey !== durationUnitCalculationKey) {
      calculateDurationUnitOptionsWithCounts();
    }
  }, [durationUnitCalculated, getCurrentCalculationKey, durationUnitCalculationKey, calculateDurationUnitOptionsWithCounts]);

  // Don't render anything until the subscription check is complete
  if (auth.isLoading || auth.shouldRedirect) {
    return (
      <div className="loader-overlay">
        <div className="cssloader">
          <div className="sh1"></div>
          <div className="sh2"></div>
          <h4 className="lt">loading</h4>
        </div>
      </div>
    );
  }

  return (
    <AppLayout activeTab="historicalRates">
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <ErrorMessage error={error} />
        {authError && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
            <div className="flex items-center">
              <div className="h-5 w-5 text-yellow-500 mr-2">⚠️</div>
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-3 sm:mb-0">
            Rate History
          </h1>
        </div>

          <button
            onClick={resetFilters}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-[#012C61] text-white rounded-lg hover:bg-blue-800 transition-colors mb-4"
          >
            Reset All Filters
          </button>

          <div className="space-y-8">
            <div className="p-4 sm:p-6 bg-white rounded-xl shadow-lg">
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
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Instructions:</strong> Select filters below. All filters are interconnected and update dynamically.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                    {/* Service Line */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Service Line</label>
                      <Select
                        instanceId="service_category_select"
                        options={availableServiceCategories.map((o: string) => ({ value: o, label: o }))}
                        value={selections.service_category ? { value: selections.service_category, label: selections.service_category } : null}
                        onChange={option => handleSelectionChange('service_category', option?.value || null)}
                        placeholder="Select Service Line"
                        isClearable
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selections.service_category && (
                        <button onClick={() => handleSelectionChange('service_category', null)} className="text-xs text-blue-500 hover:underline mt-1">Clear</button>
                      )}
                    </div>
                    {/* State */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">State(s)</label>
                      <Select
                        instanceId="state_name_select"
                        options={availableStates.map((o: string) => ({ value: o, label: o }))}
                        value={selectedStates.map(state => ({ value: state, label: state }))}
                        onChange={options => {
                          const newStates = options ? options.map(opt => opt.value) : [];
                          setSelectedStates(newStates);
                          // Update the legacy state_name for backward compatibility
                          handleSelectionChange('state_name', newStates.length === 1 ? newStates[0] : null);
                        }}
                        placeholder="Select State(s)"
                        isClearable
                        isMulti
                        isSearchable
                        filterOption={jumpToLetterFilterOption}
                        isDisabled={!selections.service_category || availableStates.length === 0}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selectedStates.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-xs text-gray-500">
                            {selectedStates.length} state{selectedStates.length !== 1 ? 's' : ''} selected:
                          </span>
                          {selectedStates.map(state => (
                            <button
                              key={state}
                              onClick={() => {
                                const newStates = selectedStates.filter(s => s !== state);
                                setSelectedStates(newStates);
                                handleSelectionChange('state_name', newStates.length === 1 ? newStates[0] : null);
                              }}
                              className="text-xs text-blue-500 hover:text-red-500 hover:underline"
                            >
                              {state} ×
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Service Code */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Service Code</label>
                      <Select
                        instanceId="service_code_select"
                        options={availableServiceCodes.map((o: string) => ({ value: o, label: o }))}
                        value={selections.service_code ? selections.service_code.split(',').map(code => ({ value: code.trim(), label: code.trim() })) : null}
                        onChange={(options) => handleSelectionChange('service_code', options ? options.map(opt => opt.value).join(',') : null)}
                        placeholder="Select Service Code(s)"
                        isMulti
                        isClearable
                        isDisabled={!selections.service_category || selectedStates.length === 0 || availableServiceCodes.length === 0}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selections.service_code && (
                        <button onClick={() => handleSelectionChange('service_code', null)} className="text-xs text-blue-500 hover:underline mt-1">Clear</button>
                      )}
                    </div>
                    {/* Service Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Service Description</label>
                      <Select
                        instanceId="service_description_select"
                        options={availableServiceDescriptions.map((o: string) => ({ value: o, label: o }))}
                        value={selections.service_description ? { value: selections.service_description, label: selections.service_description } : null}
                        onChange={option => handleSelectionChange('service_description', option?.value || null)}
                        placeholder="Select Service Description"
                        isClearable
                        isDisabled={!selections.service_category || selectedStates.length === 0 || availableServiceDescriptions.length === 0}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selections.service_description && (
                        <button onClick={() => handleSelectionChange('service_description', null)} className="text-xs text-blue-500 hover:underline mt-1">Clear</button>
                      )}
                    </div>
                    {/* Program */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Program</label>
                      <Select
                        instanceId="program_select"
                        options={getDropdownOptions(availablePrograms, false)}
                        value={selections.program ? selections.program.split('|').map(p => ({ value: p.trim(), label: p.trim() })) : null}
                        onChange={(options) => handleSelectionChange('program', options ? options.map(opt => opt.value).join('|') : null)}
                        placeholder="Select Program"
                        isMulti
                        isClearable
                        isSearchable
                        filterOption={jumpToLetterFilterOption}
                        isDisabled={!selections.service_category || selectedStates.length === 0 || availablePrograms.length === 0}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selections.program && (
                        <button onClick={() => handleSelectionChange('program', null)} className="text-xs text-blue-500 hover:underline mt-1">Clear</button>
                      )}
                    </div>
                    {/* Location/Region */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Location/Region</label>
                      <Select
                        instanceId="location_region_select"
                        options={getDropdownOptions(availableLocationRegions, false)}
                        value={selections.location_region ? selections.location_region.split(',').map(l => ({ value: l.trim(), label: l.trim() })) : null}
                        onChange={(options) => handleSelectionChange('location_region', options ? options.map(opt => opt.value).join(',') : null)}
                        placeholder="Select Location/Region"
                        isMulti
                        isClearable
                        isSearchable
                        filterOption={jumpToLetterFilterOption}
                        isDisabled={!selections.service_category || selectedStates.length === 0 || availableLocationRegions.length === 0}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selections.location_region && (
                        <button onClick={() => handleSelectionChange('location_region', null)} className="text-xs text-blue-500 hover:underline mt-1">Clear</button>
                      )}
                    </div>
                    {/* Provider Type */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Provider Type</label>
                      <Select
                        instanceId="provider_type_select"
                        options={getDropdownOptions(availableProviderTypes, false)}
                        value={selections.provider_type ? selections.provider_type.split(',').map(p => ({ value: p.trim(), label: p.trim() })) : null}
                        onChange={(options) => handleSelectionChange('provider_type', options ? options.map(opt => opt.value).join(',') : null)}
                        placeholder="Select Provider Type"
                        isMulti
                        isClearable
                        isSearchable
                        filterOption={jumpToLetterFilterOption}
                        isDisabled={!selections.service_category || selectedStates.length === 0 || availableProviderTypes.length === 0}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selections.provider_type && (
                        <button onClick={() => handleSelectionChange('provider_type', null)} className="text-xs text-blue-500 hover:underline mt-1">Clear</button>
                      )}
                    </div>
                    {/* Duration Unit */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Duration Unit</label>
                      <Select
                        instanceId="duration_unit_select"
                        options={durationUnitCalculated 
                          ? durationUnitOptionsWithCounts 
                          : getDropdownOptions(availableDurationUnits, false)
                        }
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
                        isDisabled={!selections.service_category || selectedStates.length === 0 || availableDurationUnits.length === 0}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selections.duration_unit && (
                        <button onClick={() => handleSelectionChange('duration_unit', null)} className="text-xs text-blue-500 hover:underline mt-1">Clear</button>
                      )}
                    </div>
                    {/* Modifier */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Modifier</label>
                      <Select
                        instanceId="modifier_1_select"
                        options={[{ value: '-', label: '-' }, ...availableModifiers.map((o: string) => {
                          const def =
                            filterOptionsData?.combinations?.find((c: any) => c.modifier_1 === o)?.modifier_1_details ||
                            filterOptionsData?.combinations?.find((c: any) => c.modifier_2 === o)?.modifier_2_details ||
                            filterOptionsData?.combinations?.find((c: any) => c.modifier_3 === o)?.modifier_3_details ||
                            filterOptionsData?.combinations?.find((c: any) => c.modifier_4 === o)?.modifier_4_details;
                          return { value: o, label: def ? `${o} - ${def}` : o };
                        })]}
                        value={selections.modifier_1 ? selections.modifier_1.split('|').map(m => {
                          const mod = availableModifiers.find(opt => opt === m.trim());
                          if (mod) {
                            const def =
                              filterOptionsData?.combinations?.find((c: any) => c.modifier_1 === mod)?.modifier_1_details ||
                              filterOptionsData?.combinations?.find((c: any) => c.modifier_2 === mod)?.modifier_2_details ||
                              filterOptionsData?.combinations?.find((c: any) => c.modifier_3 === mod)?.modifier_3_details ||
                              filterOptionsData?.combinations?.find((c: any) => c.modifier_4 === mod)?.modifier_4_details;
                            return { value: mod, label: def ? `${mod} - ${def}` : mod };
                          }
                          return { value: m.trim(), label: m.trim() };
                        }) : null}
                        onChange={(options) => handleSelectionChange('modifier_1', options ? options.map(opt => opt.value).join('|') : null)}
                        placeholder="Select Modifier"
                        isMulti
                        isClearable
                        isSearchable
                        filterOption={jumpToLetterFilterOption}
                        isDisabled={!selections.service_category || selectedStates.length === 0 || availableModifiers.length === 0}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                      {selections.modifier_1 && (
                        <button onClick={() => handleSelectionChange('modifier_1', null)} className="text-xs text-blue-500 hover:underline mt-1">Clear</button>
                      )}
                    </div>
                  </div>
                  {/* Search Button */}
                  <div className="mt-6 flex items-center justify-end space-x-4">
                    <button 
                      onClick={async () => {
                        if (areFiltersApplied && selectedStates.length > 0) {
                          setHasSearched(true);
                          const filters: Record<string, string> = {};
                          if (selections.service_category) filters.service_category = selections.service_category;
                          if (selections.service_code) filters.service_code = selections.service_code; // Already comma-separated from multi-select
                          if (selections.service_description) filters.service_description = selections.service_description;
                          if (selections.program) filters.program = selections.program;
                          if (selections.location_region) filters.location_region = selections.location_region;
                          if (selections.provider_type) filters.provider_type = selections.provider_type;
                          if (selections.duration_unit) filters.durationUnit = selections.duration_unit;
                          if (selections.modifier_1) filters.modifier_1 = selections.modifier_1;
                          filters.page = String(currentPage);
                          filters.itemsPerPage = String(itemsPerPage);
                          
                          const results = await fetchDataForStates(selectedStates, filters);
                          setStateData(results);
                          
                          // For backward compatibility, also update the main data state with combined data
                          const combinedData = results.flatMap(result => result.data);
                          setData(combinedData);
                        }
                      }}
                      disabled={!areFiltersApplied || loading} 
                      className="px-6 py-2 text-sm bg-[#012C61] text-white rounded-lg hover:bg-blue-800 disabled:bg-gray-400 transition-colors"
                    >
                      {loading ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {!hasSearched && (
              <div className="p-6 bg-white rounded-xl shadow-lg text-center">
                <div className="flex justify-center items-center mb-4">
                  <FaFilter className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Please select filters and click Search to view historical rates
                </p>
                <p className="text-sm text-gray-500">
                  Choose a service line, state, and service code or service description, then click Search to see available rate history
                </p>
              </div>
            )}

             {selectedEntries.length > 0 && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {selectedEntries.length} item{selectedEntries.length !== 1 ? 's' : ''} selected
                    </span>
                    {selectedEntries.map((entry, index) => {
                      const color = colorPalette[index % colorPalette.length];
                      return (
                        <div key={index} className="flex items-center space-x-1">
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: color, borderColor: color }}
                          ></div>
                          <span className="text-xs text-gray-500">
                            {entry.state_name} - {entry.service_description || entry.service_code}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setSelectedEntries([])}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                {comment && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Comment:</strong> {comment}
                    </p>
                  </div>
                )}

                <div className="p-6 bg-white rounded-xl shadow-lg">
                  <h2 className="text-xl font-semibold mb-4 text-gray-800">Rate History</h2>
                  
                  {/* Helpful explanation */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>📊 Chart Explanation:</strong> This chart shows how the rates for the selected items have changed over time. 
                      Each point represents a different effective date when the rate was updated.
                      <br />
                      <strong>📈 Extended Lines:</strong> Chart lines extend to today's date with dashed lines showing projected rates at the same level as the latest data point.
                      <br />
                      <strong>🔍 Overlap Handling:</strong> Use the legend to show/hide lines, hover for detailed tooltips, and zoom/pan for closer inspection of overlapping data.
                    </p>
                  </div>
                  
                  {/* Chart Controls */}
                  <div className="mb-4 flex flex-wrap gap-2 items-center">
                    <button
                      onClick={() => setShowLabels(!showLabels)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        showLabels 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {showLabels ? '🔢 Hide Labels' : '🔢 Show Labels'}
                    </button>
                    <span className="text-xs text-gray-500">
                      💡 Tip: Use legend to toggle lines, zoom to inspect overlaps
                    </span>
                  </div>
                  
                  <div className="w-full h-80">
                    <ReactECharts
                      option={{
                        tooltip: {
                          trigger: 'axis',
                          axisPointer: {
                            type: 'cross',
                            crossStyle: {
                              color: '#3B82F6'
                            },
                            lineStyle: {
                              color: '#3B82F6',
                              width: 2,
                              type: 'solid'
                            }
                          },
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          borderColor: '#E5E7EB',
                          borderWidth: 1,
                          borderRadius: 8,
                          textStyle: {
                            color: '#1F2937',
                            fontSize: 13
                          },
                          padding: [12, 16],
                          formatter: (params: any) => {
                            if (!params || params.length === 0) return '';
                            
                            const date = params[0].axisValue;
                            let tooltipContent = `
                              <div style="
                                font-weight: 600; 
                                color: #374151; 
                                margin-bottom: 12px; 
                                padding-bottom: 8px; 
                                border-bottom: 1px solid #E5E7EB;
                                font-size: 14px;
                              ">
                                ${formatDate(date)}
                              </div>
                            `;
                            
                            params.forEach((param: any) => {
                              const data = param.data;
                              if (!data || data.value === null || data.value === undefined) return;
                              
                              const rate = data.value ? `$${data.value.toFixed(2)}` : '-';
                              const isExtended = data.isExtended ? ' (Projected)' : '';
                              
                              tooltipContent += `
                                <div style="
                                  margin-bottom: 8px; 
                                  padding: 10px; 
                                  background: linear-gradient(135deg, ${param.color}15, ${param.color}08); 
                                  border-radius: 6px; 
                                  border-left: 3px solid ${param.color};
                                ">
                                  <div style="
                                    color: ${param.color}; 
                                    font-weight: 600; 
                                    margin-bottom: 6px; 
                                    font-size: 13px;
                                  ">
                                    ${param.seriesName}${isExtended}
                                  </div>
                                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px; color: #6B7280;">
                                    <div><span style="font-weight: 500;">Rate:</span> <span style="color: #1F2937; font-weight: 600;">${rate}</span></div>
                                    <div><span style="font-weight: 500;">State:</span> ${data.state || '-'}</div>
                                    <div><span style="font-weight: 500;">Code:</span> ${data.serviceCode || '-'}</div>
                                    <div><span style="font-weight: 500;">Provider:</span> ${data.providerType || '-'}</div>
                                  </div>
                                </div>
                              `;
                            });
                            
                            return tooltipContent;
                          }
                        },
                        xAxis: {
                          type: 'category',
                          data: getGraphData.xAxis,
                          name: 'Effective Date',
                          nameLocation: 'middle',
                          nameGap: 30,
                          axisLabel: {
                            formatter: (value: string) => formatDate(value)
                          }
                        },
                        yAxis: {
                          type: 'value',
                          name: showRatePerHour ? 'Hourly Equivalent Rate ($)' : 'Rate Per Base Unit ($)',
                          nameLocation: 'middle',
                          nameGap: 40,
                          scale: true,
                          min: (value: { min: number }) => value.min * 0.95,
                          max: (value: { max: number }) => value.max * 1.05,
                          axisLabel: {
                            formatter: (value: number) => value.toFixed(2)
                          }
                        },
                        legend: {
                          show: true,
                          top: 10,
                          left: 'center',
                          type: 'scroll',
                          textStyle: {
                            fontSize: 12,
                            color: '#374151'
                          },
                          itemWidth: 25,
                          itemHeight: 14,
                          itemGap: 20,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderColor: '#ccc',
                          borderWidth: 1,
                          borderRadius: 5,
                          padding: [10, 15],
                          shadowBlur: 10,
                          shadowColor: 'rgba(0, 0, 0, 0.1)',
                          shadowOffsetX: 0,
                          shadowOffsetY: 2,
                          formatter: (name: string) => {
                            // Truncate long names for better legend display
                            return name.length > 30 ? name.substring(0, 30) + '...' : name;
                          },
                          selectedMode: 'single', // Allow selecting multiple series
                          selector: [
                            {
                              type: 'all',
                              title: 'All'
                            },
                            {
                              type: 'inverse',
                              title: 'Inverse'
                            }
                          ],
                          selectorLabel: {
                            color: '#374151',
                            fontSize: 12
                          },
                          selectorPosition: 'end',
                          selectorItemGap: 7,
                          selectorButtonGap: 10
                        },
                        dataZoom: [
                          {
                            type: 'inside',
                            start: 0,
                            end: 100,
                            zoomOnMouseWheel: true,
                            moveOnMouseMove: true,
                            moveOnMouseWheel: false
                          },
                          {
                            type: 'slider',
                            show: true,
                            start: 0,
                            end: 100,
                            bottom: 30,
                            height: 20,
                            handleStyle: {
                              color: '#3b82f6'
                            },
                            textStyle: {
                              color: '#374151'
                            }
                          }
                        ],
                        brush: {
                          toolbox: ['lineX', 'clear'],
                          xAxisIndex: 0
                        },
                        toolbox: {
                          show: true,
                          right: 20,
                          top: 20,
                          feature: {
                            dataZoom: {
                              yAxisIndex: 'none',
                              title: {
                                zoom: 'Zoom',
                                back: 'Reset Zoom'
                              }
                            },
                            restore: {
                              title: 'Reset'
                            },
                            saveAsImage: {
                              title: 'Save as Image'
                            }
                          }
                        },
                        series: getGraphData.series.map((seriesItem: any, index: number) => ({
                          data: seriesItem.data,
                          name: seriesItem.name,
                          type: 'line',
                          smooth: false,
                          z: 10 - index, // Higher z-index for earlier series (they appear on top)
                          emphasis: {
                            focus: 'series',
                            blurScope: 'coordinateSystem'
                          },
                          itemStyle: {
                            color: (params: any) => {
                              // Use different color for extended points
                              return params.data?.isExtended ? seriesItem.color + '80' : seriesItem.color; // 80 = 50% opacity
                            }
                          },
                          lineStyle: {
                            color: seriesItem.color,
                            width: 3, // Slightly thicker lines for better visibility
                            opacity: 0.8,
                            type: (params: any) => {
                              // Use dashed line for extended portion
                              return params.dataIndex > 0 && seriesItem.data[params.dataIndex]?.isExtended ? 'dashed' : 'solid';
                            }
                          },
                          symbol: 'circle',
                          symbolSize: (params: any) => {
                            // Smaller symbol for extended points, larger for better visibility
                            return params.data?.isExtended ? 5 : 8;
                          },
                          symbolKeepAspect: true,
                          showSymbol: true,
                          hoverAnimation: true,
                          label: {
                            show: showLabels, // Toggle labels based on state
                            position: 'top',
                            formatter: (params: any) => {
                              if (params.data?.displayValue) {
                                return params.data.displayValue;
                              }
                              const prefix = params.data?.isExtended ? '→ ' : '';
                              return `${prefix}$${params.value.toFixed(2)}`;
                            },
                            fontSize: 10,
                            color: '#374151',
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            borderColor: '#ccc',
                            borderWidth: 1,
                            borderRadius: 3,
                            padding: [2, 4]
                          }
                        })),
                        graphic: getGraphData.series.some((seriesItem: any) => seriesItem.data.some((data: any) => data.displayValue)) ? [
                          {
                            type: 'text',
                            left: 'center',
                            top: 'middle',
                            style: {
                              text: `Hourly equivalent rates not available as the duration unit is "${getGraphData.series.find((seriesItem: any) => seriesItem.data.some((data: any) => data.displayValue))?.data.find((data: any) => data.displayValue)?.durationUnit || 'Unknown'}"`,
                              fontSize: 16,
                              fontWeight: 'bold',
                              fill: '#666'
                            }
                          }
                        ] : [],
                        grid: {
                          containLabel: true,
                          left: '10%',
                          right: '3%',
                          bottom: '10%',
                          top: '10%'
                        }
                      }}
                      style={{ height: '100%', width: '100%' }}
                      notMerge={true}
                      showLoading={filteredData.length === 0}
                      loadingOption={{
                        text: 'No data available',
                        color: '#3b82f6',
                        textColor: '#374151',
                        maskColor: 'rgba(255, 255, 255, 0.8)',
                        zlevel: 0
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Loading state when filters are applied but data is loading */}
            {areFiltersApplied && loading && (
              <div className="p-6 bg-white rounded-xl shadow-lg text-center">
                <div className="flex justify-center items-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Loading table data...
                </p>
                <p className="text-sm text-gray-500">
                  Please wait while we fetch and process your data.
                </p>
              </div>
            )}

            {/* Multi-State Tables */}
            {areFiltersApplied && !loading && stateData.length > 0 && (
              <div className="space-y-8">
                {stateData.map((stateResult, stateIndex) => (
                  <div key={stateResult.state} className="space-y-4">
                    {/* State Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colorPalette[stateIndex % colorPalette.length] }}></span>
                        {stateResult.state} ({stateResult.totalCount} records)
                      </h3>
                    </div>
                    
                    {/* State Table */}
              <div className="overflow-hidden rounded-lg shadow-lg">
                <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider"></th>
                      {getVisibleColumns.service_category && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Service Category</th>
                      )}
                      {getVisibleColumns.service_code && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Service Code</th>
                      )}
                      {getVisibleColumns.service_description && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Service Description</th>
                      )}
                      {getVisibleColumns.rate && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Rate per Base Unit</th>
                      )}
                      {getVisibleColumns.duration_unit && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Duration Unit</th>
                      )}
                      {getVisibleColumns.rate_effective_date && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                      )}
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Provider Type</th>
                      {getVisibleColumns.modifier_1 && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Modifier 1</th>
                      )}
                      {getVisibleColumns.modifier_2 && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Modifier 2</th>
                      )}
                      {getVisibleColumns.modifier_3 && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Modifier 3</th>
                      )}
                      {getVisibleColumns.modifier_4 && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Modifier 4</th>
                      )}
                      {getVisibleColumns.program && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Program</th>
                      )}
                      {getVisibleColumns.location_region && (
                        <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Location/Region</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                      {stateResult.data.map((entry, index) => {
                        const isSelected = selectedEntries.some(selected => 
                          selected.state_name === entry.state_name &&
                          selected.service_category === entry.service_category &&
                          selected.service_code === entry.service_code &&
                          selected.service_description === entry.service_description &&
                          selected.program === entry.program &&
                          selected.location_region === entry.location_region &&
                          selected.modifier_1 === entry.modifier_1 &&
                          selected.modifier_1_details === entry.modifier_1_details &&
                          selected.modifier_2 === entry.modifier_2 &&
                          selected.modifier_2_details === entry.modifier_2_details &&
                          selected.modifier_3 === entry.modifier_3 &&
                          selected.modifier_3_details === entry.modifier_3_details &&
                          selected.modifier_4 === entry.modifier_4 &&
                          selected.modifier_4_details === entry.modifier_4_details &&
                          selected.duration_unit === entry.duration_unit &&
                          selected.provider_type === entry.provider_type &&
                          selected.rate_effective_date === entry.rate_effective_date
                        );
                        const selectionIndex = selectedEntries.findIndex(selected => 
                          selected.state_name === entry.state_name &&
                          selected.service_category === entry.service_category &&
                          selected.service_code === entry.service_code &&
                          selected.service_description === entry.service_description &&
                          selected.program === entry.program &&
                          selected.location_region === entry.location_region &&
                          selected.modifier_1 === entry.modifier_1 &&
                          selected.modifier_1_details === entry.modifier_1_details &&
                          selected.modifier_2 === entry.modifier_2 &&
                          selected.modifier_2_details === entry.modifier_2_details &&
                          selected.modifier_3 === entry.modifier_3 &&
                          selected.modifier_3_details === entry.modifier_3_details &&
                          selected.modifier_4 === entry.modifier_4 &&
                          selected.modifier_4_details === entry.modifier_4_details &&
                          selected.duration_unit === entry.duration_unit &&
                          selected.provider_type === entry.provider_type &&
                          selected.rate_effective_date === entry.rate_effective_date
                        );
                        const selectionColor = selectionIndex >= 0 ? colorPalette[selectionIndex] : null;

                        const rateValue = parseRate(entry.rate);
                        const durationUnit = entry.duration_unit?.toUpperCase();
                      const hourlyRate = durationUnit === '15 MINUTES' ? rateValue * 4 : rateValue;

                      return (
                        <tr 
                          key={`${stateResult.state}-${index}`} 
                          className={`group relative transition-all duration-200 ease-in-out cursor-pointer ${
                            isSelected 
                              ? 'shadow-[0_0_0_2px_rgba(0,0,0,0.1)] hover:scale-[1.01] hover:z-10' 
                              : 'hover:bg-gray-50 hover:shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:scale-[1.01] hover:z-10'
                          }`}
                          style={isSelected && selectionColor ? { backgroundColor: `${selectionColor}20`, borderLeft: `4px solid ${selectionColor}` } : {}}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedEntries(prev => prev.filter(selected => 
                                !(selected.state_name === entry.state_name &&
                                  selected.service_category === entry.service_category &&
                                  selected.service_code === entry.service_code &&
                                  selected.service_description === entry.service_description &&
                                  selected.program === entry.program &&
                                  selected.location_region === entry.location_region &&
                                  selected.modifier_1 === entry.modifier_1 &&
                                  selected.modifier_1_details === entry.modifier_1_details &&
                                  selected.modifier_2 === entry.modifier_2 &&
                                  selected.modifier_2_details === entry.modifier_2_details &&
                                  selected.modifier_3 === entry.modifier_3 &&
                                  selected.modifier_3_details === entry.modifier_3_details &&
                                  selected.modifier_4 === entry.modifier_4 &&
                                  selected.modifier_4_details === entry.modifier_4_details &&
                                  selected.duration_unit === entry.duration_unit &&
                                  selected.provider_type === entry.provider_type &&
                                  selected.rate_effective_date === entry.rate_effective_date)
                              ));
                            } else {
                              setSelectedEntries(prev => {
                                const exists = prev.some(selected => 
                                  selected.state_name === entry.state_name &&
                                  selected.service_category === entry.service_category &&
                                  selected.service_code === entry.service_code &&
                                  selected.service_description === entry.service_description &&
                                  selected.program === entry.program &&
                                  selected.location_region === entry.location_region &&
                                  selected.modifier_1 === entry.modifier_1 &&
                                  selected.modifier_1_details === entry.modifier_1_details &&
                                  selected.modifier_2 === entry.modifier_2 &&
                                  selected.modifier_2_details === entry.modifier_2_details &&
                                  selected.modifier_3 === entry.modifier_3 &&
                                  selected.modifier_3_details === entry.modifier_3_details &&
                                  selected.modifier_4 === entry.modifier_4 &&
                                  selected.modifier_4_details === entry.modifier_4_details &&
                                  selected.duration_unit === entry.duration_unit &&
                                  selected.provider_type === entry.provider_type &&
                                  selected.rate_effective_date === entry.rate_effective_date
                                );
                                if (!exists && prev.length < colorPalette.length) {
                                  return [...prev, entry];
                                }
                                return prev;
                              });
                            }
                          }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                isSelected 
                                    ? 'shadow-[0_0_0_3px_rgba(0,0,0,0.2)]' 
                                  : 'border-gray-300 group-hover:border-blue-300 group-hover:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]'
                                }`}
                                style={isSelected && selectionColor ? { 
                                  backgroundColor: selectionColor, 
                                  borderColor: selectionColor 
                                } : {}}
                              >
                                {isSelected && (
                                  <svg 
                                    className="w-3 h-3 text-white transition-transform duration-200" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth={2} 
                                      d="M5 13l4 4L19 7" 
                                    />
                                  </svg>
                                )}
                              </div>
                              {isSelected && (
                                <button
                                  onClick={e => { 
                                    e.stopPropagation(); 
                                    setSelectedEntries(prev => prev.filter(selected => 
                                      !(selected.state_name === entry.state_name &&
                                        selected.service_category === entry.service_category &&
                                        selected.service_code === entry.service_code &&
                                        selected.service_description === entry.service_description &&
                                        selected.program === entry.program &&
                                        selected.location_region === entry.location_region &&
                                        selected.modifier_1 === entry.modifier_1 &&
                                        selected.modifier_1_details === entry.modifier_1_details &&
                                        selected.modifier_2 === entry.modifier_2 &&
                                        selected.modifier_2_details === entry.modifier_2_details &&
                                        selected.modifier_3 === entry.modifier_3 &&
                                        selected.modifier_3_details === entry.modifier_3_details &&
                                        selected.modifier_4 === entry.modifier_4 &&
                                        selected.modifier_4_details === entry.modifier_4_details &&
                                        selected.duration_unit === entry.duration_unit &&
                                        selected.provider_type === entry.provider_type &&
                                        selected.rate_effective_date === entry.rate_effective_date)
                                    )); 
                                  }}
                                  className="ml-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                                  title="Deselect"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                          {getVisibleColumns.service_category && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {SERVICE_CATEGORY_ABBREVIATIONS[entry.service_category?.trim().toUpperCase() || ""] || entry.service_category || '-'}
                              </td>
                          )}
                          {getVisibleColumns.service_code && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatText(entry.service_code)}</td>
                          )}
                          {getVisibleColumns.service_description && (
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-[220px] truncate" title={entry.service_description || '-'}>{entry.service_description || '-'}</td>
                          )}
                          {getVisibleColumns.rate && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatRate(entry.rate)}
                            </td>
                          )}
                          {getVisibleColumns.duration_unit && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.duration_unit || '-'}
                            </td>
                          )}
                          {getVisibleColumns.rate_effective_date && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(entry.rate_effective_date)}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatText(entry.provider_type)}
                          </td>
                          {getVisibleColumns.modifier_1 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.modifier_1 ? `${entry.modifier_1}${entry.modifier_1_details ? ` - ${entry.modifier_1_details}` : ''}` : '-'}
                            </td>
                          )}
                          {getVisibleColumns.modifier_2 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.modifier_2 ? `${entry.modifier_2}${entry.modifier_2_details ? ` - ${entry.modifier_2_details}` : ''}` : '-'}
                            </td>
                          )}
                          {getVisibleColumns.modifier_3 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.modifier_3 ? `${entry.modifier_3}${entry.modifier_3_details ? ` - ${entry.modifier_3_details}` : ''}` : '-'}
                            </td>
                          )}
                          {getVisibleColumns.modifier_4 && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.modifier_4 ? `${entry.modifier_4}${entry.modifier_4_details ? ` - ${entry.modifier_4_details}` : ''}` : '-'}
                            </td>
                          )}
                          {getVisibleColumns.program && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {entry.program}
                            </td>
                          )}
                          {getVisibleColumns.location_region && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatText(entry.location_region)}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {areFiltersApplied && selectedEntries.length === 0 && (
              <div className="p-6 bg-white rounded-xl shadow-lg text-center">
                <div className="flex justify-center items-center mb-4">
                  <FaChartLine className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Select a rate entry to view its historical data
                </p>
                <p className="text-sm text-gray-500">
                  Click on any row in the table above to see the rate history graph
                </p>
              </div>
            )}
          </div>
      </div>
    </AppLayout>
  );
}