"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import AppLayout from "@/app/components/applayout";
import { Search, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaExclamationCircle, FaSearch, FaSort, FaSortUp, FaSortDown, FaFilter, FaChartLine } from 'react-icons/fa';
import { useRequireSubscription } from "@/hooks/useRequireAuth";
import { supabase } from "@/lib/supabase";
import { createPortal } from "react-dom";
import Select from 'react-select';

// Define the type for the datasets
interface Alert {
  subject: string;
  announcement_date: string;
  state?: string | null;
  link?: string | null;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  summary?: string;
}

interface Bill {
  id: number;
  state: string;
  bill_number: string;
  name: string;
  last_action: string | null;
  action_date: string | null;
  sponsor_list: string[] | null;
  bill_progress: string | null;
  url: string;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  ai_summary: string;
}

interface StatePlanAmendment {
  id: string;
  "Transmittal Number"?: string | null;
  link?: string | null;
  state?: string | null;
  subject?: string | null;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  "Effective Date"?: string | null;
  "Approval Date"?: string | null;
}

// Map state names to codes
const stateMap: { [key: string]: string } = {
  ALABAMA: "AL",
  ALASKA: "AK",
  ARIZONA: "AZ",
  ARKANSAS: "AR",
  CALIFORNIA: "CA",
  COLORADO: "CO",
  CONNECTICUT: "CT",
  DELAWARE: "DE",
  FLORIDA: "FL",
  GEORGIA: "GA",
  HAWAII: "HI",
  IDAHO: "ID",
  ILLINOIS: "IL",
  INDIANA: "IN",
  IOWA: "IA",
  KANSAS: "KS",
  KENTUCKY: "KY",
  LOUISIANA: "LA",
  MAINE: "ME",
  MARYLAND: "MD",
  MASSACHUSETTS: "MA",
  MICHIGAN: "MI",
  MINNESOTA: "MN",
  MISSISSIPPI: "MS",
  MISSOURI: "MO",
  MONTANA: "MT",
  NEBRASKA: "NE",
  NEVADA: "NV",
  "NEW HAMPSHIRE": "NH",
  "NEW JERSEY": "NJ",
  "NEW MEXICO": "NM",
  "NEW YORK": "NY",
  "NORTH CAROLINA": "NC",
  "NORTH DAKOTA": "ND",
  OHIO: "OH",
  OKLAHOMA: "OK",
  OREGON: "OR",
  PENNSYLVANIA: "PA",
  "RHODE ISLAND": "RI",
  "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD",
  TENNESSEE: "TN",
  TEXAS: "TX",
  UTAH: "UT",
  VERMONT: "VT",
  VIRGINIA: "VA",
  WASHINGTON: "WA",
  "WEST VIRGINIA": "WV",
  WISCONSIN: "WI",
  WYOMING: "WY",
};

// Include reverse mapping for easier access
const reverseStateMap = Object.fromEntries(
  Object.entries(stateMap).map(([key, value]) => [value, key])
);

// Add these new interfaces after your existing interfaces
interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}

interface MultiSelectDropdownProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}

// React Select Multi Dropdown Component
function ReactSelectMultiDropdown({ values, onChange, options, placeholder }: MultiSelectDropdownProps) {
  const selectedOptions = options.filter(option => values.includes(option.value));
  
  return (
    <Select
      isMulti
      isSearchable={true}
      value={selectedOptions}
      onChange={(selected) => {
        const newValues = selected ? selected.map(option => option.value) : [];
        onChange(newValues);
      }}
      options={options}
      placeholder={placeholder}
      className="w-full"
      classNamePrefix="react-select"
      filterOption={(option, inputValue) => {
        if (!inputValue) return true;
        return option.label.toLowerCase().startsWith(inputValue.toLowerCase());
      }}
      styles={{
        control: (provided, state) => ({
          ...provided,
          backgroundColor: 'white',
          borderColor: state.isFocused ? '#3b82f6' : '#93c5fd',
          borderRadius: '0.5rem',
          minHeight: '48px',
          boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
          '&:hover': {
            borderColor: '#3b82f6'
          }
        }),
        menu: (provided) => ({
          ...provided,
          backgroundColor: 'white',
          border: '1px solid #93c5fd',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 9999
        }),
        option: (provided, state) => ({
          ...provided,
          backgroundColor: state.isSelected ? '#eff6ff' : state.isFocused ? '#f1f5f9' : 'white',
          color: '#1f2937',
          '&:hover': {
            backgroundColor: state.isSelected ? '#eff6ff' : '#f1f5f9'
          }
        }),
        multiValue: (provided) => ({
          ...provided,
          backgroundColor: '#eff6ff',
          border: '1px solid #93c5fd'
        }),
        multiValueLabel: (provided) => ({
          ...provided,
          color: '#1f2937'
        }),
        multiValueRemove: (provided) => ({
          ...provided,
          color: '#6b7280',
          '&:hover': {
            backgroundColor: '#dbeafe',
            color: '#1f2937'
          }
        }),
        input: (provided) => ({
          ...provided,
          color: '#1f2937'
        })
      }}
    />
  );
}

// Add this new component before your main component
function CustomDropdown({ value, onChange, options, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, width: 0 });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update menu position when opening
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-2 bg-white border border-blue-300 rounded-md text-gray-800 focus:outline-none cursor-pointer flex justify-between items-center"
           onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption?.label || placeholder}</span>
        <div className="flex items-center">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="mr-2 hover:text-gray-200 focus:outline-none cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </span>
          )}
          <span>▼</span>
        </div>
      </div>
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          className="fixed bg-white border border-blue-300 rounded-md shadow-lg z-[99999]" 
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            width: menuPosition.width,
            backgroundColor: '#fff'
          }}
        >
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-blue-100 text-gray-800 bg-white"
                style={{backgroundColor: '#fff'}}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Add multi-select dropdown component
// Old MultiSelectDropdown component removed - replaced with ReactSelectMultiDropdown above

function SearchBar({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
}) {
  return (
    <div className="flex items-center w-full">
      <div className="flex items-center w-full px-4 py-2 bg-white border border-blue-300 rounded-md">
        <Search size={20} className="text-gray-800 mr-2" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none placeholder-gray-600 text-gray-800 focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-gray-800 hover:text-gray-200 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Add these helper functions before the RateDevelopments component
const searchInFields = (searchText: string, fields: (string | null | undefined)[]): boolean => {
  const normalizedSearch = searchText.toLowerCase().trim();
  if (!normalizedSearch) return true;
  
  return fields.some(field => {
    if (!field) return false;
    const normalizedField = field.toLowerCase();
    
    // Industry-standard word boundary detection
    // Matches word boundaries more accurately using Unicode-aware regex
    const wordBoundaryRegex = /[\p{Z}\p{P}]/u;
    const words = normalizedField.split(wordBoundaryRegex).filter(word => word.length > 0);
    
    // Only check if any word starts with the search text (first letter matching)
    // This will match "IDD" when searching for "I" but not "SAID" when searching for "I"
    const hasPrefixMatch = words.some(word => {
      const match = word.startsWith(normalizedSearch);
      // Debug logging for troubleshooting
      if (normalizedSearch === 'revision' && match) {
        console.log('Found match for "revision":', { word, normalizedSearch, field: field.substring(0, 100) + '...' });
      }
      return match;
    });
    
    return hasPrefixMatch;
  });
};

// Add a helper function to get service lines for alerts
const getAlertServiceLines = (alert: Alert) => {
  return [
    alert.service_lines_impacted,
    alert.service_lines_impacted_1,
    alert.service_lines_impacted_2,
    alert.service_lines_impacted_3
  ]
    .filter(line => line && line.toUpperCase() !== 'NULL')
    .join(", ");
};

// Search index function for first letter/prefix matching
const createSearchIndex = (items: any[], searchableFields: string[]) => {
  const index = new Map<string, Set<number>>();
  
  items.forEach((item, idx) => {
    searchableFields.forEach(field => {
      const value = item[field];
      if (value && typeof value === 'string') {
        const normalizedValue = value.toLowerCase();
        const words = normalizedValue.split(/[\p{Z}\p{P}]/u).filter(word => word.length > 0);
        
        words.forEach(word => {
          // Create prefix indexes for each word (for first letter matching)
          // This allows "I" to match "IDD", "IN" to match "INDIANA", etc.
          // ONLY create prefixes that start from the beginning of the word
          for (let i = 1; i <= word.length; i++) {
            const prefix = word.substring(0, i);
            if (!index.has(prefix)) {
              index.set(prefix, new Set());
            }
            index.get(prefix)!.add(idx);
          }
          
          // Debug: Log if we're creating a prefix for "revision"
          if (word.includes('revision')) {
            console.log('Found word containing "revision":', { word, itemIndex: idx });
          }
        });
      }
    });
  });
  
  return index;
};

const searchWithIndex = (searchText: string, items: any[], searchableFields: string[], searchIndex?: Map<string, Set<number>>) => {
  const normalizedSearch = searchText.toLowerCase().trim();
  if (!normalizedSearch) return items;
  
  // Debug logging
  if (normalizedSearch === 'revision') {
    console.log('Searching for "revision" with index:', searchIndex ? 'available' : 'not available');
  }
  
  // If no index provided, fall back to the original search (which now only does first letter matching)
  if (!searchIndex) {
    const results = items.filter(item => 
      searchableFields.some(field => {
        const value = item[field];
        return value && searchInFields(normalizedSearch, [value]);
      })
    );
    
    if (normalizedSearch === 'revision') {
      console.log('Fallback search results for "revision":', results.length);
    }
    
    return results;
  }
  
  // Use the search index for better performance - only match words that start with search text
  const matchingIndices = searchIndex.get(normalizedSearch);
  if (!matchingIndices) {
    if (normalizedSearch === 'revision') {
      console.log('No matching indices found for "revision" in index');
    }
    return [];
  }
  
  const results = Array.from(matchingIndices).map(idx => items[idx]);
  
  if (normalizedSearch === 'revision') {
    console.log('Index search results for "revision":', results.length);
    results.forEach((item, i) => {
      console.log(`Result ${i + 1}:`, {
        subject: item.subject?.substring(0, 100),
        summary: item.summary?.substring(0, 100)
      });
    });
  }
  
  return results;
};

// Utility: Convert Excel serial date or string to MM/DD/YYYY
function formatExcelOrStringDate(val: any): string {
  if (val == null || val === "") return "";
  // If it's a number or a string that looks like a number (Excel serial)
  const serial = typeof val === "number" ? val : (typeof val === "string" && /^\d{5,6}$/.test(val.trim()) ? parseInt(val, 10) : null);
  if (serial && serial > 20000 && serial < 90000) { // Excel serial range
    // Excel's epoch starts at 1899-12-31, but there is a bug for 1900 leap year, so add 1
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + serial * 86400000);
    // If the date is within 2 years of today, it's probably correct
    const now = new Date();
    if (Math.abs(date.getTime() - now.getTime()) < 2 * 365 * 86400000) {
      return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    }
  }
  // Try parsing as a date string (prefer US format)
  let d = new Date(val);
  if (!isNaN(d.getTime())) {
    // If the date is within 2 years of today, it's probably correct
    const now = new Date();
    if (Math.abs(d.getTime() - now.getTime()) < 2 * 365 * 86400000) {
      return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    }
  }
  // Fallback: just return as string
  return String(val);
}

export default function RateDevelopments() {
  const auth = useRequireSubscription();
  const router = useRouter();

  // Authentication is now handled by useRequireSubscription hook

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [statePlanAmendments, setStatePlanAmendments] = useState<StatePlanAmendment[]>([]);

  const [providerSearch, setProviderSearch] = useState<string>("");
  const [legislativeSearch, setLegislativeSearch] = useState<string>("");
  const [spaSearch, setSpaSearch] = useState<string>("");

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedServiceLine, setSelectedServiceLine] = useState<string>("");
  const [selectedProviderStates, setSelectedProviderStates] = useState<string[]>([]);
  const [selectedProviderServiceLines, setSelectedProviderServiceLines] = useState<string[]>([]);
  const [selectedLegislativeStates, setSelectedLegislativeStates] = useState<string[]>([]);
  const [selectedLegislativeServiceLines, setSelectedLegislativeServiceLines] = useState<string[]>([]);
  const [selectedSpaStates, setSelectedSpaStates] = useState<string[]>([]);
  const [selectedSpaServiceLines, setSelectedSpaServiceLines] = useState<string[]>([]);

  const [selectedBillProgress, setSelectedBillProgress] = useState<string>("");

  const [layout, setLayout] = useState<"vertical" | "horizontal">("horizontal");
  const [activeTable, setActiveTable] = useState<"provider" | "legislative" | "spa">("provider");

  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null); // For the pop-up modal
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState("");

  const [sortDirection, setSortDirection] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'announcement_date', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("providerBulletins");
  // Subscription check state removed - handled by centralized auth

  const [serviceLines, setServiceLines] = useState<string[]>([]);
  
  // Add search indexes for better performance
  const [providerSearchIndex, setProviderSearchIndex] = useState<Map<string, Set<number>>>();
  const [legislativeSearchIndex, setLegislativeSearchIndex] = useState<Map<string, Set<number>>>();
  const [spaSearchIndex, setSpaSearchIndex] = useState<Map<string, Set<number>>>();
  
  useEffect(() => {
    const fetchServiceCategories = async () => {
      const { data, error } = await supabase.from("service_category_list").select("categories");
      if (!error && data) {
        setServiceLines(data.map((row: any) => row.categories));
      }
    };
    fetchServiceCategories();
  }, []);
  
  // Create search indexes when data changes
  useEffect(() => {
    if (alerts.length > 0) {
      const index = createSearchIndex(alerts, ['subject', 'summary']);
      setProviderSearchIndex(index);
    }
  }, [alerts]);
  
  useEffect(() => {
    if (bills.length > 0) {
      const index = createSearchIndex(bills, ['name', 'bill_number', 'last_action']);
      setLegislativeSearchIndex(index);
    }
  }, [bills]);

  useEffect(() => {
    if (statePlanAmendments.length > 0) {
      const index = createSearchIndex(statePlanAmendments, ['subject', 'Transmittal Number']);
      setSpaSearchIndex(index);
    }
  }, [statePlanAmendments]);

  const uniqueServiceLines = useMemo(() => Array.from(new Set(serviceLines)).sort(), [serviceLines]);

  // Dynamic service lines based on selected states
  const availableProviderServiceLines = useMemo(() => {
    console.log('Calculating available provider service lines:', {
      selectedProviderStates,
      alertsCount: alerts.length,
      uniqueServiceLinesCount: uniqueServiceLines.length
    });
    
    if (selectedProviderStates.length === 0) {
      return uniqueServiceLines;
    }
    
    const serviceLinesInSelectedStates = new Set<string>();
    
    alerts.forEach(alert => {
      // Check if alert is in selected states
      const alertStateCode = reverseStateMap[alert.state || ''] || alert.state;
      const isInSelectedState = (alertStateCode && selectedProviderStates.includes(alertStateCode)) || 
                               selectedProviderStates.includes(alert.state || '') ||
                               (alert.state && selectedProviderStates.some(selectedState => 
                                 selectedState && selectedState in reverseStateMap && reverseStateMap[selectedState as keyof typeof reverseStateMap] === alert.state
                               ));
      
      console.log('Alert state check:', {
        alertState: alert.state,
        alertStateCode,
        selectedStates: selectedProviderStates,
        isInSelectedState
      });
      
      if (isInSelectedState) {
        // Add service lines from this alert
        const alertServiceLines = [alert.service_lines_impacted, alert.service_lines_impacted_1, alert.service_lines_impacted_2, alert.service_lines_impacted_3]
          .filter((line): line is string => line !== null && line !== undefined && line.toUpperCase() !== 'NULL');
        
        console.log('Adding service lines from alert:', {
          alertSubject: alert.subject,
          alertServiceLines
        });
        
        alertServiceLines.forEach(line => serviceLinesInSelectedStates.add(line));
      }
    });
    
    const result = Array.from(serviceLinesInSelectedStates).sort();
    console.log('Final available provider service lines:', result);
    
    return result;
  }, [alerts, selectedProviderStates, uniqueServiceLines]);

  const availableLegislativeServiceLines = useMemo(() => {
    if (selectedLegislativeStates.length === 0) {
      return uniqueServiceLines;
    }
    
    const serviceLinesInSelectedStates = new Set<string>();
    
    bills.forEach(bill => {
      // Check if bill is in selected states
      const billStateCode = reverseStateMap[bill.state || ''] || bill.state;
      const isInSelectedState = selectedLegislativeStates.includes(billStateCode) || 
                               selectedLegislativeStates.includes(bill.state || '') ||
                               (bill.state && selectedLegislativeStates.some(selectedState => 
                                 selectedState && reverseStateMap[selectedState] === bill.state
                               ));
      
      if (isInSelectedState) {
        // Add service lines from this bill
        [bill.service_lines_impacted, bill.service_lines_impacted_1, bill.service_lines_impacted_2, bill.service_lines_impacted_3]
          .filter((line): line is string => line !== null && line !== undefined && line.toUpperCase() !== 'NULL')
          .forEach(line => serviceLinesInSelectedStates.add(line));
      }
    });
    
    return Array.from(serviceLinesInSelectedStates).sort();
  }, [bills, selectedLegislativeStates, uniqueServiceLines]);

  const availableSpaServiceLines = useMemo(() => {
    if (selectedSpaStates.length === 0) {
      return uniqueServiceLines;
    }
    
    const serviceLinesInSelectedStates = new Set<string>();
    
    statePlanAmendments.forEach(spa => {
      const spaStateCode = reverseStateMap[spa.state || ''] || spa.state || '';
      const isInSelectedState = selectedSpaStates.includes(spaStateCode) || 
                               selectedSpaStates.includes(spa.state || '') ||
                               (spa.state && selectedSpaStates.some(selectedState => 
                                 selectedState && reverseStateMap[selectedState] === spa.state
                               ));
      
      if (isInSelectedState) {
        [spa.service_lines_impacted, spa.service_lines_impacted_1, spa.service_lines_impacted_2, spa.service_lines_impacted_3]
          .filter((line): line is string => line !== null && line !== undefined && line.toUpperCase() !== 'NULL')
          .forEach(line => serviceLinesInSelectedStates.add(line));
      }
    });
    
    return Array.from(serviceLinesInSelectedStates).sort();
  }, [statePlanAmendments, selectedSpaStates, uniqueServiceLines]);

  // Reset all filters function
  const resetAllFilters = () => {
    setProviderSearch("");
    setLegislativeSearch("");
    setSpaSearch("");
    setSelectedProviderStates([]);
    setSelectedProviderServiceLines([]);
    setSelectedLegislativeStates([]);
    setSelectedLegislativeServiceLines([]);
    setSelectedSpaStates([]);
    setSelectedSpaServiceLines([]);
    setSelectedBillProgress("");
  };

  // Authentication and subscription checks are now handled by useRequireSubscription hook

  // Fetch data once authentication is complete
  useEffect(() => {
    if (auth.isAuthenticated && auth.hasActiveSubscription && !auth.isLoading) {
      fetchData();
    }
  }, [auth.isAuthenticated, auth.hasActiveSubscription, auth.isLoading]);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Provider Alerts from Supabase
    const { data: providerAlerts, error: providerError } = await supabase
      .from("provider_alerts")
      .select("*")
      .order("announcement_date", { ascending: false });
    if (providerError) {
      setAlerts([]);
    } else {
      setAlerts(providerAlerts || []);
    }

    // Fetch Legislative Updates from Supabase
    const { data: billsData, error: billsError } = await supabase
      .from("bill_track_50")
      .select("*");
    if (billsError) {
      setBills([]);
    } else {
      setBills(billsData || []);
    }

    // Fetch State Plan Amendments from Supabase
    const { data: spaData, error: spaError } = await supabase
      .from("state_plan_amendments")
      .select("*");
    if (spaError) {
      console.error("Error fetching state plan amendments:", spaError);
      setStatePlanAmendments([]);
    } else {
      setStatePlanAmendments(spaData || []);
    }
    setLoading(false);
  };

  // Function to toggle sort direction
  const toggleSort = (field: string) => {
    setSortDirection(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sorting logic for provider alerts with date validation and proper arithmetic operation
  const sortedProviderAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      if (sortDirection.field === 'state') {
        if (a.state && b.state) {
          return sortDirection.direction === 'asc' ? a.state.localeCompare(b.state) : b.state.localeCompare(a.state);
        }
      } else if (sortDirection.field === 'announcement_date') {
        const dateA = a.announcement_date ? new Date(a.announcement_date).getTime() : 0; // Convert to timestamp or use 0 if invalid
        const dateB = b.announcement_date ? new Date(b.announcement_date).getTime() : 0; // Convert to timestamp or use 0 if invalid
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [alerts, sortDirection]);

  // Sorting logic for legislative updates with date validation and proper arithmetic operation
  const sortedLegislativeUpdates = useMemo(() => {
    return [...bills].sort((a, b) => {
      if (sortDirection.field === 'state') {
        // Ensure both a.state and b.state are not null or undefined before comparing
        const stateA = a.state || ""; // Fallback to empty string if null or undefined
        const stateB = b.state || ""; // Fallback to empty string if null or undefined
        return sortDirection.direction === 'asc' ? stateA.localeCompare(stateB) : stateB.localeCompare(stateA);
      } else if (sortDirection.field === 'action_date') {
        const dateA = a.action_date ? new Date(a.action_date).getTime() : 0;
        const dateB = b.action_date ? new Date(b.action_date).getTime() : 0;
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [bills, sortDirection]);

  // Sorting logic for state plan amendments
  const sortedStatePlanAmendments = useMemo(() => {
    return [...statePlanAmendments].sort((a, b) => {
      if (sortDirection.field === 'state') {
        const stateA = a.state || "";
        const stateB = b.state || "";
        return sortDirection.direction === 'asc' ? stateA.localeCompare(stateB) : stateB.localeCompare(stateA);
      } else if (sortDirection.field === 'Effective Date') {
        const dateA = a["Effective Date"] ? new Date(a["Effective Date"]).getTime() : 0;
        const dateB = b["Effective Date"] ? new Date(b["Effective Date"]).getTime() : 0;
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortDirection.field === 'Approval Date') {
        const dateA = a["Approval Date"] ? new Date(a["Approval Date"]).getTime() : 0;
        const dateB = b["Approval Date"] ? new Date(b["Approval Date"]).getTime() : 0;
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [statePlanAmendments, sortDirection]);

  // Update the filtered data logic to use sorted arrays with improved search
  const filteredProviderAlerts = useMemo(() => {
    console.log('Filtering provider alerts:', { selectedProviderStates, selectedProviderServiceLines });
    
    // First apply search filter using the index for better performance
    let searchFiltered = sortedProviderAlerts;
    if (providerSearch) {
      // Temporarily disable search index to test fallback search
      searchFiltered = searchWithIndex(providerSearch, sortedProviderAlerts, ['subject', 'summary'], undefined);
    }
    
    return searchFiltered.filter((alert) => {
      // Fix state matching logic - handle both state codes and full names
      const matchesState = selectedProviderStates.length === 0 || 
        (alert.state && (
          selectedProviderStates.includes(alert.state) || // Direct match
          selectedProviderStates.some(selectedState => 
            reverseStateMap[selectedState] === alert.state // Match state code to full name
          )
        ));

      const matchesServiceLine = selectedProviderServiceLines.length === 0 || 
      [
        alert.service_lines_impacted,
        alert.service_lines_impacted_1,
        alert.service_lines_impacted_2,
        alert.service_lines_impacted_3,
        ].some(line => line && selectedProviderServiceLines.some(selectedLine => line.includes(selectedLine)));

      console.log('Alert filtering:', {
        alertState: alert.state,
        selectedStates: selectedProviderStates,
        matchesState,
        alertServiceLines: [alert.service_lines_impacted, alert.service_lines_impacted_1, alert.service_lines_impacted_2, alert.service_lines_impacted_3],
        selectedServiceLines: selectedProviderServiceLines,
        matchesServiceLine
      });

      return matchesState && matchesServiceLine;
    });
  }, [sortedProviderAlerts, providerSearch, selectedProviderStates, selectedProviderServiceLines, providerSearchIndex]);

  // Update the filteredLegislativeUpdates logic to include bill progress filter with improved search
  const filteredLegislativeUpdates = useMemo(() => {
    console.log('Filtering legislative updates:', { selectedLegislativeStates, selectedLegislativeServiceLines, selectedBillProgress });
    
    // First apply search filter using the index for better performance
    let searchFiltered = sortedLegislativeUpdates;
    if (legislativeSearch) {
      searchFiltered = searchWithIndex(legislativeSearch, sortedLegislativeUpdates, ['name', 'bill_number', 'last_action'], legislativeSearchIndex);
    }
    
    return searchFiltered.filter((bill) => {
      // Fix state matching logic - handle both state codes and full names
      const matchesState = selectedLegislativeStates.length === 0 || 
        (bill.state && (
          selectedLegislativeStates.includes(bill.state) || // Direct match
          selectedLegislativeStates.some(selectedState => 
            reverseStateMap[selectedState] === bill.state // Match state code to full name
          )
        ));

      const matchesServiceLine = selectedLegislativeServiceLines.length === 0 || 
      [
        bill.service_lines_impacted,
        bill.service_lines_impacted_1,
        bill.service_lines_impacted_2
        ].some(line => line && selectedLegislativeServiceLines.some(selectedLine => line.includes(selectedLine)));

      const matchesBillProgress = !selectedBillProgress || 
        bill.bill_progress?.includes(selectedBillProgress);

      console.log('Bill filtering:', {
        billState: bill.state,
        selectedStates: selectedLegislativeStates,
        matchesState,
        billServiceLines: [bill.service_lines_impacted, bill.service_lines_impacted_1, bill.service_lines_impacted_2],
        selectedServiceLines: selectedLegislativeServiceLines,
        matchesServiceLine,
        billProgress: bill.bill_progress,
        selectedProgress: selectedBillProgress,
        matchesBillProgress
      });

      return matchesState && matchesServiceLine && matchesBillProgress;
    });
  }, [sortedLegislativeUpdates, legislativeSearch, selectedLegislativeStates, selectedLegislativeServiceLines, selectedBillProgress, legislativeSearchIndex]);

  // Filtered State Plan Amendments
  const filteredStatePlanAmendments = useMemo(() => {
    let searchFiltered = sortedStatePlanAmendments;
    if (spaSearch) {
      searchFiltered = searchWithIndex(spaSearch, sortedStatePlanAmendments, ['subject', 'Transmittal Number'], spaSearchIndex);
    }
    
    return searchFiltered.filter((spa) => {
      const matchesState = selectedSpaStates.length === 0 || 
        (spa.state && (
          selectedSpaStates.includes(spa.state || '') ||
          selectedSpaStates.some(selectedState => 
            selectedState && reverseStateMap[selectedState] === spa.state
          )
        ));

      const matchesServiceLine = selectedSpaServiceLines.length === 0 || 
        [
          spa.service_lines_impacted,
          spa.service_lines_impacted_1,
          spa.service_lines_impacted_2,
          spa.service_lines_impacted_3,
        ].some(line => line && selectedSpaServiceLines.some(selectedLine => line.includes(selectedLine)));

      return matchesState && matchesServiceLine;
    });
  }, [sortedStatePlanAmendments, spaSearch, selectedSpaStates, selectedSpaServiceLines, spaSearchIndex]);

  const getServiceLines = (bill: Bill) => {
    return [
      bill.service_lines_impacted,
      bill.service_lines_impacted_1,
      bill.service_lines_impacted_2,
      bill.service_lines_impacted_3
    ]
      .filter(line => line && line.toUpperCase() !== 'NULL')
      .join(", ");
  };

  const getSpaServiceLines = (spa: StatePlanAmendment) => {
    return [
      spa.service_lines_impacted,
      spa.service_lines_impacted_1,
      spa.service_lines_impacted_2,
      spa.service_lines_impacted_3
    ]
      .filter(line => line && line.toUpperCase() !== 'NULL')
      .join(", ");
  };

  // Function to handle click on bill name
  const handleBillClick = (bill: Bill) => {
    setPopupContent(bill.ai_summary);
    setShowPopup(true);
  };

  // 1. Add a state to track previous data and changed cells
  const [prevAlerts, setPrevAlerts] = useState<Alert[]>([]);
  const [prevBills, setPrevBills] = useState<Bill[]>([]);
  const [highlightedCells, setHighlightedCells] = useState<{ [rowKey: string]: string[] }>({});

  // 2. When new data is fetched, compare to previous and highlight changed cells
  useEffect(() => {
    if (!loading) {
      const newHighlights: { [rowKey: string]: string[] } = {};
      // Provider Alerts
      alerts.forEach((alert, idx) => {
        const prev = prevAlerts[idx];
        if (!prev) return;
        Object.keys(alert).forEach(key => {
          if ((alert as any)[key] !== (prev as any)[key]) {
            if (!newHighlights[`alert-${idx}`]) newHighlights[`alert-${idx}`] = [];
            newHighlights[`alert-${idx}`].push(key);
          }
        });
      });
      // Bills
      bills.forEach((bill, idx) => {
        const prev = prevBills[idx];
        if (!prev) return;
        Object.keys(bill).forEach(key => {
          if ((bill as any)[key] !== (prev as any)[key]) {
            if (!newHighlights[`bill-${idx}`]) newHighlights[`bill-${idx}`] = [];
            newHighlights[`bill-${idx}`].push(key);
          }
        });
      });
      setHighlightedCells(newHighlights);
      setPrevAlerts(alerts);
      setPrevBills(bills);
    }
  }, [alerts, bills, loading]);

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
    <AppLayout activeTab="rateDevelopments">
      <h1 className="text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-6">
        Rate Developments
      </h1>

      {/* Search Bars and Filters Container */}
      <div className="mb-10 p-6 sm:p-10 bg-white rounded-3xl shadow-2xl border border-blue-200">
        {/* Reset Filters Button */}
        <div className="flex items-center mb-6">
          <button
            onClick={resetAllFilters}
            className="px-6 py-2 text-sm bg-[#012C61] text-white rounded-lg hover:bg-blue-800 transition-colors disabled:bg-gray-400 font-semibold shadow-sm"
          >
            Reset All Filters
          </button>
        </div>
        
        {/* Conditional Filter Display */}
        {layout === "vertical" ? (
          // Vertical Layout: Show both filter sets side by side
          <div className="flex flex-col md:flex-row gap-10">
            {/* Left Column: Provider Alerts Filters */}
            <div className="flex-1 flex flex-col gap-5">
              <span className="text-xs uppercase tracking-wider text-[#012C61] font-lemonMilkRegular mb-1 ml-1">Provider Alerts Filters</span>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                value={providerSearch}
                  onChange={e => setProviderSearch(e.target.value)}
                  placeholder="Search Provider Alerts by subject or summary"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all placeholder-gray-500 text-base shadow-sm"
              />
              </div>
              <div className="relative pl-10">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <ReactSelectMultiDropdown
                  values={selectedProviderStates}
                  onChange={setSelectedProviderStates}
                  options={Object.entries(stateMap).map(([name, code]) => ({
                    value: code,
                    label: `${name} [${code}]`
                  }))}
                  placeholder="All States"
                />
              </div>
              <div className="relative pl-10">
                <FaChartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <ReactSelectMultiDropdown
                  values={selectedProviderServiceLines}
                  onChange={setSelectedProviderServiceLines}
                  options={availableProviderServiceLines.map(line => ({ value: line, label: line }))}
                  placeholder="All Service Lines"
                />
              </div>
            </div>

            {/* Divider for md+ screens */}
            <div className="hidden md:block w-px bg-blue-100 mx-4 my-2 rounded-full" />

            {/* Middle Column: Legislative Updates Filters */}
            <div className="flex-1 flex flex-col gap-5">
              <span className="text-xs uppercase tracking-wider text-[#012C61] font-lemonMilkRegular mb-1 ml-1">Legislative Updates Filters</span>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                value={legislativeSearch}
                  onChange={e => setLegislativeSearch(e.target.value)}
                placeholder="Search Legislative Updates by Bill Name or Bill Number"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all placeholder-gray-500 text-base shadow-sm"
              />
            </div>
              <div className="relative pl-10">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <ReactSelectMultiDropdown
                  values={selectedLegislativeStates}
                  onChange={setSelectedLegislativeStates}
                  options={Object.entries(stateMap).map(([name, code]) => ({
                    value: code,
                    label: `${name} [${code}]`
                  }))}
                placeholder="All States"
              />
            </div>
              <div className="relative pl-10">
                <FaChartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <ReactSelectMultiDropdown
                  values={selectedLegislativeServiceLines}
                  onChange={setSelectedLegislativeServiceLines}
                  options={availableLegislativeServiceLines.map(line => ({ value: line, label: line }))}
                  placeholder="All Service Lines"
                />
              </div>
              <div className="relative pl-10">
                <LayoutList className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <Select
                  isSearchable={true}
                  value={selectedBillProgress ? { value: selectedBillProgress, label: selectedBillProgress } : null}
                  onChange={(option) => setSelectedBillProgress(option?.value || "")}
                options={[
                    { value: "", label: "All Bill Progress" },
                    { value: "Introduced", label: "Introduced" },
                    { value: "In Committee", label: "In Committee" },
                    { value: "Passed", label: "Passed" },
                    { value: "Failed", label: "Failed" },
                    { value: "Vetoed", label: "Vetoed" },
                    { value: "Enacted", label: "Enacted" }
                  ]}
                  placeholder="All Bill Progress"
                  className="w-full"
                  classNamePrefix="react-select"
                  filterOption={(option, inputValue) => {
                    if (!inputValue) return true;
                    return option.label.toLowerCase().startsWith(inputValue.toLowerCase());
                  }}
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      backgroundColor: 'white',
                      borderColor: state.isFocused ? '#3b82f6' : '#93c5fd',
                      borderRadius: '0.5rem',
                      minHeight: '48px',
                      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                      '&:hover': {
                        borderColor: '#3b82f6'
                      }
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: 'white',
                      border: '1px solid #93c5fd',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 9999
                    }),
                    option: (provided, state) => ({
                      ...provided,
                      backgroundColor: state.isSelected ? '#eff6ff' : state.isFocused ? '#f1f5f9' : 'white',
                      color: '#1f2937',
                      '&:hover': {
                        backgroundColor: state.isSelected ? '#eff6ff' : '#f1f5f9'
                      }
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: '#1f2937'
                    })
                  }}
                />
              </div>
            </div>

            {/* Divider for md+ screens */}
            <div className="hidden md:block w-px bg-blue-100 mx-4 my-2 rounded-full" />

            {/* Right Column: SPA/Waiver Amendments Filters */}
              <div className="flex-1 flex flex-col gap-5">
                <span className="text-xs uppercase tracking-wider text-[#012C61] font-lemonMilkRegular mb-1 ml-1">SPA/Waiver Amendments Filters</span>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  value={spaSearch}
                  onChange={e => setSpaSearch(e.target.value)}
                  placeholder="Search SPA/Waiver Amendments by subject or transmittal number"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all placeholder-gray-500 text-base shadow-sm"
                />
              </div>
              <div className="relative pl-10">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <ReactSelectMultiDropdown
                  values={selectedSpaStates}
                  onChange={setSelectedSpaStates}
                  options={Object.entries(stateMap).map(([name, code]) => ({
                    value: code,
                    label: `${name} [${code}]`
                  }))}
                  placeholder="All States"
                />
              </div>
              <div className="relative pl-10">
                <FaChartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                <ReactSelectMultiDropdown
                  values={selectedSpaServiceLines}
                  onChange={setSelectedSpaServiceLines}
                  options={availableSpaServiceLines.map(line => ({ value: line, label: line }))}
                  placeholder="All Service Lines"
                />
              </div>
            </div>
          </div>
        ) : (
          // Horizontal Layout: Show only active table filters
          <div className="flex flex-col gap-5">
            {activeTable === "provider" ? (
              // Provider Alerts Filters
              <>
                <span className="text-xs uppercase tracking-wider text-[#012C61] font-lemonMilkRegular mb-1 ml-1">Provider Alerts Filters</span>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="text"
                    value={providerSearch}
                    onChange={e => setProviderSearch(e.target.value)}
                    placeholder="Search Provider Alerts by subject or summary"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all placeholder-gray-500 text-base shadow-sm"
                  />
                </div>
                <div className="relative pl-10">
                  <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <ReactSelectMultiDropdown
                    values={selectedProviderStates}
                    onChange={setSelectedProviderStates}
                    options={Object.entries(stateMap).map(([name, code]) => ({
                      value: code,
                      label: `${name} [${code}]`
                    }))}
                    placeholder="All States"
                  />
                </div>
                <div className="relative pl-10">
                  <FaChartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <ReactSelectMultiDropdown
                    values={selectedProviderServiceLines}
                    onChange={setSelectedProviderServiceLines}
                    options={availableProviderServiceLines.map(line => ({ value: line, label: line }))}
                placeholder="All Service Lines"
              />
            </div>
              </>
            ) : activeTable === "legislative" ? (
              // Legislative Updates Filters
              <>
                <span className="text-xs uppercase tracking-wider text-[#012C61] font-lemonMilkRegular mb-1 ml-1">Legislative Updates Filters</span>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="text"
                    value={legislativeSearch}
                    onChange={e => setLegislativeSearch(e.target.value)}
                    placeholder="Search Legislative Updates by Bill Name or Bill Number"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all placeholder-gray-500 text-base shadow-sm"
                  />
                </div>
                <div className="relative pl-10">
                  <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <ReactSelectMultiDropdown
                    values={selectedLegislativeStates}
                    onChange={setSelectedLegislativeStates}
                    options={Object.entries(stateMap).map(([name, code]) => ({
                      value: code,
                      label: `${name} [${code}]`
                    }))}
                    placeholder="All States"
                  />
                </div>
                <div className="relative pl-10">
                  <FaChartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <ReactSelectMultiDropdown
                    values={selectedLegislativeServiceLines}
                    onChange={setSelectedLegislativeServiceLines}
                    options={availableLegislativeServiceLines.map(line => ({ value: line, label: line }))}
                    placeholder="All Service Lines"
                  />
                </div>
                <div className="relative pl-10">
                  <LayoutList className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <Select
                    isSearchable={true}
                    value={selectedBillProgress ? { value: selectedBillProgress, label: selectedBillProgress } : null}
                    onChange={(option) => setSelectedBillProgress(option?.value || "")}
                  options={[
                    { value: "", label: "All Bill Progress" },
                    { value: "Introduced", label: "Introduced" },
                    { value: "In Committee", label: "In Committee" },
                    { value: "Passed", label: "Passed" },
                    { value: "Failed", label: "Failed" },
                    { value: "Vetoed", label: "Vetoed" },
                    { value: "Enacted", label: "Enacted" }
                  ]}
                  placeholder="All Bill Progress"
                    className="w-full"
                    classNamePrefix="react-select"
                    filterOption={(option, inputValue) => {
                      if (!inputValue) return true;
                      return option.label.toLowerCase().startsWith(inputValue.toLowerCase());
                    }}
                    styles={{
                      control: (provided, state) => ({
                        ...provided,
                        backgroundColor: 'white',
                        borderColor: state.isFocused ? '#3b82f6' : '#93c5fd',
                        borderRadius: '0.5rem',
                        minHeight: '48px',
                        boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                        '&:hover': {
                          borderColor: '#3b82f6'
                        }
                      }),
                      menu: (provided) => ({
                        ...provided,
                        backgroundColor: 'white',
                        border: '1px solid #93c5fd',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 9999
                      }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isSelected ? '#eff6ff' : state.isFocused ? '#f1f5f9' : 'white',
                        color: '#1f2937',
                        '&:hover': {
                          backgroundColor: state.isSelected ? '#eff6ff' : '#f1f5f9'
                        }
                      }),
                      input: (provided) => ({
                        ...provided,
                        color: '#1f2937'
                      })
                    }}
                />
              </div>
              </>
            ) : (
              // SPA/Waiver Amendments Filters
              <>
                <span className="text-xs uppercase tracking-wider text-[#012C61] font-lemonMilkRegular mb-1 ml-1">SPA/Waiver Amendments Filters</span>
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="text"
                    value={spaSearch}
                    onChange={e => setSpaSearch(e.target.value)}
                    placeholder="Search SPA/Waiver Amendments by subject or transmittal number"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-blue-300 rounded-xl text-gray-800 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all placeholder-gray-500 text-base shadow-sm"
                  />
                </div>
                <div className="relative pl-10">
                  <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <ReactSelectMultiDropdown
                    values={selectedSpaStates}
                    onChange={setSelectedSpaStates}
                    options={Object.entries(stateMap).map(([name, code]) => ({
                      value: code,
                      label: `${name} [${code}]`
                    }))}
                    placeholder="All States"
                  />
                </div>
                <div className="relative pl-10">
                  <FaChartLine className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <ReactSelectMultiDropdown
                    values={selectedSpaServiceLines}
                    onChange={setSelectedSpaServiceLines}
                    options={availableSpaServiceLines.map(line => ({ value: line, label: line }))}
                    placeholder="All Service Lines"
                  />
                </div>
              </>
            )}
          </div>
        )}
        </div>
      <style jsx>{`
        .search-bar-input, .custom-dropdown {
          font-size: 1.1rem;
          padding: 0.75rem 1rem;
        }
        @media (max-width: 768px) {
          .rounded-3xl { border-radius: 1.25rem !important; }
        }
      `}</style>

      {/* Layout Toggle Buttons, Filters, and Table Switch */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setLayout("vertical")}
            className={`p-2 rounded-md flex items-center ${
              layout === "vertical" ? "bg-[#004aad] text-white" : "bg-gray-200"
            }`}
            style={{ height: "40px" }}
          >
            <LayoutGrid size={20} className="mr-2" />
            <span>Vertical Layout</span>
          </button>
          <button
            onClick={() => setLayout("horizontal")}
            className={`p-2 rounded-md flex items-center ${
              layout === "horizontal" ? "bg-[#004aad] text-white" : "bg-gray-200"
            }`}
            style={{ height: "40px" }}
          >
            <LayoutList size={20} className="mr-2" />
            <span>Horizontal Layout</span>
          </button>
        </div>

        {/* Table Switch - Only show in horizontal layout */}
        {layout === "horizontal" && (
          <div className="flex items-center space-x-4 z-10 relative">
            <div className="flex bg-gray-200 rounded-lg p-1 shadow-sm">
          <button
                onClick={() => setActiveTable("provider")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTable === "provider"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
          >
                Provider Alerts
              </button>
              <button
                onClick={() => setActiveTable("legislative")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTable === "legislative"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
              }`}
              >
                Legislative Updates
          </button>
              <button
                onClick={() => setActiveTable("spa")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTable === "spa"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
              }`}
              >
                SPA/Waiver Amendments
          </button>
        </div>
          </div>
        )}
      </div>

      {/* Update the note about sorting and summaries */}
      <div className="mb-4 text-sm text-gray-600">
        <p>
          <strong>Note:</strong> Click on the column headings (State, Announcement Date, Action Date) to sort the data. 
          Also, clicking on a bill name in the Legislative Updates table will display an AI-generated summary, 
          while clicking on a subject in the Provider Alerts table will display a summary of the alert.
        </p>
      </div>

      {/* Tables */}
      {layout === "vertical" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Provider Alerts Table */}
          <div>
            <h2 className="text-xl font-semibold text-[#012C61] mb-2">
              Provider Alerts
            </h2>
            <div className="border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('announcement_date')}>
                      Announcement Date
                      {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Subject
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviderAlerts.map((alert, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {alert.state || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(alert.announcement_date)}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <div className="flex items-center">
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => {
                              if (alert.summary) {
                                setPopupContent(alert.summary);
                                setShowPopup(true);
                              }
                            }}
                          >
                            {alert.subject || ""}
                          </span>
                          {alert.link && (
                            <a
                              href={alert.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline"
                            >
                              [Read More]
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getAlertServiceLines(alert)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legislative Updates Table */}
          <div>
            <h2 className="text-xl font-semibold text-[#012C61] mb-2">
              Legislative Updates
            </h2>
            <div className="border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('action_date')}>
                      Action Date
                      {sortDirection.field === 'action_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      State Bill ID
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Bill Name
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Last Action
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Sponsors
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Progress
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegislativeUpdates.map((bill, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {reverseStateMap[bill.state] || bill.state}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(bill.action_date)}
                      </td>
                      <td className="p-4 text-sm text-blue-500 border-b">
                        <a
                          href={bill.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {bill.bill_number || ""}
                        </a>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() => handleBillClick(bill)}
                        >
                          {bill.name || ""}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.last_action || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.sponsor_list && Array.isArray(bill.sponsor_list) 
                          ? bill.sponsor_list.join(", ") 
                          : bill.sponsor_list || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.bill_progress || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getServiceLines(bill)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SPA/Waiver Amendments Table */}
          <div>
            <h2 className="text-xl font-semibold text-[#012C61] mb-2">
              SPA/Waiver Amendments
            </h2>
            <div className="border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Transmittal Number
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Subject
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('Effective Date')}>
                      Effective Date
                      {sortDirection.field === 'Effective Date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('Approval Date')}>
                      Approval Date
                      {sortDirection.field === 'Approval Date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStatePlanAmendments.map((spa, index) => (
                    <tr key={spa.id || index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {reverseStateMap[spa.state || ''] || spa.state || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {spa["Transmittal Number"] || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <div className="flex items-center">
                          <span>{spa.subject || ""}</span>
                          {spa.link && (
                            <a
                              href={spa.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline"
                            >
                              [Read More]
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(spa["Effective Date"])}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(spa["Approval Date"])}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getSpaServiceLines(spa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          {/* Table Heading */}
          <h2 className="text-xl font-semibold text-[#012C61] mb-2">
            {activeTable === "provider" ? "Provider Alerts" : activeTable === "legislative" ? "Legislative Updates" : "SPA/Waiver Amendments"}
          </h2>

          {/* Tables Container with Animation */}
          <div className="flex transition-transform duration-300 ease-in-out" style={{
            transform: `translateX(${activeTable === "provider" ? "0%" : activeTable === "legislative" ? "-100%" : "-200%"})`
          }}>
            {/* Provider Alerts Table */}
            <div className="min-w-full border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('announcement_date')}>
                      Announcement Date
                      {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Subject
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviderAlerts.map((alert, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {alert.state || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(alert.announcement_date)}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <div className="flex items-center">
                          <span
                            className="cursor-pointer hover:underline"
                            onClick={() => {
                              if (alert.summary) {
                                setPopupContent(alert.summary);
                                setShowPopup(true);
                              }
                            }}
                          >
                            {alert.subject || ""}
                          </span>
                          {alert.link && (
                            <a
                              href={alert.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline"
                            >
                              [Read More]
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getAlertServiceLines(alert)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legislative Updates Table */}
            <div className="min-w-full border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('action_date')}>
                      Action Date
                      {sortDirection.field === 'action_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      State Bill ID
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Bill Name
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Last Action
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Sponsors
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Progress
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegislativeUpdates.map((bill, index) => (
                    <tr key={index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {reverseStateMap[bill.state] || bill.state}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(bill.action_date)}
                      </td>
                      <td className="p-4 text-sm text-blue-500 border-b">
                        <a
                          href={bill.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {bill.bill_number || ""}
                        </a>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <span
                          className="cursor-pointer hover:underline"
                          onClick={() => handleBillClick(bill)}
                        >
                          {bill.name || ""}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.last_action || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.sponsor_list && Array.isArray(bill.sponsor_list) 
                          ? bill.sponsor_list.join(", ") 
                          : bill.sponsor_list || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {bill.bill_progress || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getServiceLines(bill)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SPA/Waiver Amendments Table */}
            <div className="min-w-full border rounded-md max-h-[600px] overflow-y-auto bg-gray-50 shadow-lg relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('state')}>
                      State
                      {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Transmittal Number
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Subject
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('Effective Date')}>
                      Effective Date
                      {sortDirection.field === 'Effective Date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b cursor-pointer"
                        onClick={() => toggleSort('Approval Date')}>
                      Approval Date
                      {sortDirection.field === 'Approval Date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                    </th>
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">
                      Service Lines
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStatePlanAmendments.map((spa, index) => (
                    <tr key={spa.id || index} className="border-b hover:bg-gray-100">
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {reverseStateMap[spa.state || ''] || spa.state || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {spa["Transmittal Number"] || ""}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        <div className="flex items-center">
                          <span>{spa.subject || ""}</span>
                          {spa.link && (
                            <a
                              href={spa.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:underline"
                            >
                              [Read More]
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(spa["Effective Date"])}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {formatExcelOrStringDate(spa["Approval Date"])}
                      </td>
                      <td className="p-4 text-sm text-gray-700 border-b">
                        {getSpaServiceLines(spa)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Popup for AI Summary */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-4 rounded-lg max-w-lg w-full">
            <h3 className="text-lg font-bold">
              {popupContent === alerts.find(a => a.summary === popupContent)?.summary 
                ? "Summary" 
                : "AI Summary"}
            </h3>
            <p>{popupContent}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}