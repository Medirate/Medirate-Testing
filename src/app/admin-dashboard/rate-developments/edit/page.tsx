"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import AppLayout from "@/app/components/applayout";
import { Search, LayoutGrid, LayoutList, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaSpinner, FaExclamationCircle, FaSearch, FaSort, FaSortUp, FaSortDown, FaFilter, FaChartLine } from 'react-icons/fa';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Select from 'react-select';
// Removed direct Supabase import - will use API endpoints instead

// Define the type for the datasets
interface Alert {
  id: string;
  subject: string;
  announcement_date: string;
  state?: string | null;
  link?: string | null;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  summary?: string;
  is_new: string;
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
  is_new: string;
}

interface StatePlanAmendment {
  id: string;
  "Transmittal Number"?: string | null;
  transmittal_number?: string | null;
  link?: string | null;
  state?: string | null;
  subject?: string | null;
  service_lines_impacted?: string | null;
  service_lines_impacted_1?: string | null;
  service_lines_impacted_2?: string | null;
  service_lines_impacted_3?: string | null;
  "Effective Date"?: string | null;
  effective_date?: string | null;
  "Approval Date"?: string | null;
  approval_date?: string | null;
  is_new?: string;
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

// Multi-select dropdown component interface
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
          backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
          color: state.isSelected ? 'white' : '#1f2937',
          '&:hover': {
            backgroundColor: state.isSelected ? '#3b82f6' : '#dbeafe'
          }
        }),
        multiValue: (provided) => ({
          ...provided,
          backgroundColor: '#e0f2fe'
        }),
        multiValueLabel: (provided) => ({
          ...provided,
          color: '#0369a1'
        }),
        multiValueRemove: (provided) => ({
          ...provided,
          color: '#0369a1',
          '&:hover': {
            backgroundColor: '#0369a1',
            color: 'white'
          }
        })
      }}
    />
  );
}

// Add these new interfaces after your existing interfaces
interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
}

// Add this new component before your main component
function CustomDropdown({ value, onChange, options, placeholder }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-2 bg-[#4682d1] rounded-md text-white focus:outline-none cursor-pointer flex justify-between items-center"
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
      {isOpen && (
        <div className="absolute w-full mt-1 bg-[#4682d1] border border-[#4682d1] rounded-md shadow-lg z-50">
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-[#004aad] text-white"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }: { 
  value: string; 
  onChange: (value: string) => void; 
  placeholder: string; 
}) {
  return (
    <div className="flex items-center w-full">
      <div className="flex items-center w-full px-4 py-2 bg-[#4682d1] rounded-md">
        <Search size={20} className="text-white mr-2" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none placeholder-white text-white focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="text-white hover:text-gray-200 focus:outline-none"
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
  
  return fields.some(field => 
    field?.toLowerCase().includes(normalizedSearch)
  );
};

// Add a helper function to get service lines for alerts
const getAlertServiceLines = (alert: Alert) => {
  const lines = [
    alert.service_lines_impacted,
    alert.service_lines_impacted_1,
    alert.service_lines_impacted_2,
    alert.service_lines_impacted_3
  ]
    .filter((line): line is string => !!line && line.toUpperCase() !== 'NULL');
  
  if (lines.length === 0) {
    return <span className="text-gray-400 italic">No service lines</span>;
  }
  
  return (
    <div className="flex flex-wrap gap-1">
      {lines.map((line, index) => (
        <span
          key={index}
          className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-200"
          title={line}
        >
          {line.length > 20 ? `${line.substring(0, 20)}...` : line}
        </span>
      ))}
    </div>
  );
};

// Add a helper function to get service lines for bills
const getBillServiceLines = (bill: Bill) => {
  const lines = [
    bill.service_lines_impacted,
    bill.service_lines_impacted_1,
    bill.service_lines_impacted_2,
    bill.service_lines_impacted_3
  ]
    .filter((line): line is string => !!line && line.toUpperCase() !== 'NULL');
  
  if (lines.length === 0) {
    return <span className="text-gray-400 italic">No service lines</span>;
  }
  
  return (
    <div className="flex flex-wrap gap-1">
      {lines.map((line, index) => (
        <span
          key={index}
          className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md border border-green-200"
          title={line}
        >
          {line.length > 20 ? `${line.substring(0, 20)}...` : line}
        </span>
      ))}
    </div>
  );
};

// Add this new component after the CustomDropdown component
function ServiceLinesDropdown({ 
  value, 
  onChange, 
  options, 
  placeholder 
}: { 
  value: string; 
  onChange: (value: string) => void; 
  options: { label: string; value: string }[]; 
  placeholder: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none cursor-pointer flex justify-between items-center"
           onClick={() => setIsOpen(!isOpen)}>
        <span>{selectedOption?.label || placeholder}</span>
        <div className="flex items-center">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="mr-2 hover:text-gray-500 focus:outline-none cursor-pointer"
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
      {isOpen && (
        <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
          <div className="max-h-[200px] overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.value}
                className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-700"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Add this new component for multi-select service lines with search functionality
function MultiServiceLinesDropdown({ 
  values, 
  onChange, 
  options, 
  placeholder 
}: { 
  values: string[]; 
  onChange: (values: string[]) => void; 
  options: { label: string; value: string }[]; 
  placeholder: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOptions = options.filter(opt => values.includes(opt.value));
  
  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (value: string) => {
    if (values.includes(value)) {
      // Remove if already selected
      onChange(values.filter(v => v !== value));
    } else if (values.length < 3) {
      // Add if less than 3 selected
      onChange([...values, value]);
    }
    // Keep dropdown open for multiple selections
  };

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value));
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 focus:outline-none cursor-pointer flex justify-between items-center hover:border-blue-400 transition-colors"
        onClick={handleToggle}
      >
        <div className="flex flex-wrap gap-1 flex-1 min-h-[24px]">
          {selectedOptions.length > 0 ? (
            selectedOptions.map((option, index) => (
              <span
                key={`${option.value}-${index}`}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 max-w-full"
                title={option.label}
              >
                <span className="truncate max-w-[150px]">{option.label}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option.value);
                  }}
                  className="ml-1 hover:text-blue-600 flex-shrink-0"
                >
                  ×
                </button>
              </span>
            ))
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </div>
      
      {isOpen && (
        <div className="absolute w-[400px] min-w-[300px] max-w-[90vw] mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 left-0">
          {/* Search Input */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search service lines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Options List */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-3 cursor-pointer hover:bg-blue-50 text-gray-700 border-b border-gray-100 last:border-b-0 ${
                    values.includes(option.value) ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm break-words">{option.label}</span>
                    {values.includes(option.value) && (
                      <span className="text-blue-600 text-sm flex-shrink-0 ml-2">✓</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm text-center">
                No service lines found matching "{searchTerm}"
              </div>
            )}
          </div>
          
          {/* Selected Count */}
          {values.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              {values.length} of 3 selected
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function for is_new text logic
const isNew = (val: any) => {
  if (!val) return false;
  const v = String(val).trim().toLowerCase();
  return v === "yes" || v === "true" || v === "1" || v === "y" || v === "new";
};

// Helper function to check if service lines are blank
const hasBlankServiceLines = (item: Alert | Bill | StatePlanAmendment) => {
  // All items now have 4 service line columns
  const serviceLines = [
    item.service_lines_impacted,
    item.service_lines_impacted_1,
    item.service_lines_impacted_2,
    (item as Alert | Bill | StatePlanAmendment).service_lines_impacted_3
  ].filter(line => line !== undefined && line && line.trim() !== '' && line.toUpperCase() !== 'NULL');
  
  return serviceLines.length === 0;
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
  const { isAuthenticated, isLoading, user } = useKindeBrowserClient();
  const router = useRouter();

  // Add CSS for table column widths
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .service-lines-column {
        min-width: 200px !important;
        width: 200px !important;
      }
      .service-lines-cell {
        min-width: 200px !important;
        width: 200px !important;
      }
      .service-lines-dropdown {
        min-width: 200px !important;
        width: 200px !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Add authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/api/auth/login");
    } else if (isAuthenticated) {
      checkSubscriptionAndSubUser();
    }
  }, [isAuthenticated, isLoading, router]);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [statePlanAmendments, setStatePlanAmendments] = useState<StatePlanAmendment[]>([]);

  const [providerSearch, setProviderSearch] = useState<string>("");
  const [legislativeSearch, setLegislativeSearch] = useState<string>("");
  const [spaSearch, setSpaSearch] = useState<string>("");

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedServiceLine, setSelectedServiceLine] = useState<string>("");
  
  // Multi-select filter states
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
  
  // New filter states
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyBlankServiceLines, setShowOnlyBlankServiceLines] = useState(false);
  
  // Popup state for summaries
  const [showPopup, setShowPopup] = useState(false);
  const [popupContent, setPopupContent] = useState("");
  const [popupTitle, setPopupTitle] = useState("");

  const [sortDirection, setSortDirection] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: 'announcement_date', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("providerBulletins");
  const [isSubscriptionCheckComplete, setIsSubscriptionCheckComplete] = useState(false);

  const [serviceLines, setServiceLines] = useState<string[]>([]);
  const [serviceCategories, setServiceCategories] = useState<{ id: string; categories: string }[]>([]);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState<string>("");

  const [newCategory, setNewCategory] = useState("");

  // Update the edit state to handle multiple service lines
  const [editingProviderServiceLines, setEditingProviderServiceLines] = useState<string[]>([]);
  const [editingBillServiceLines, setEditingBillServiceLines] = useState<string[]>([]);

  // 1. Add a state to track highlighted cells
  const [highlightedCells, setHighlightedCells] = useState<{ [rowKey: string]: string[] }>({});



  // Deduplicate and normalize serviceCategories for dropdown options
  const normalizedServiceLineOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    for (const cat of serviceCategories) {
      const norm = cat.categories.trim().toLowerCase();
      if (!seen.has(norm)) {
        seen.add(norm);
        options.push({ label: cat.categories.trim(), value: cat.categories.trim() });
      }
    }
    return options;
  }, [serviceCategories]);

  // Add subscription check function
  const checkSubscriptionAndSubUser = async () => {
    const userEmail = user?.email ?? "";
    const kindeUserId = user?.id ?? "";
    console.log('🔍 Checking subscription for:', { userEmail, kindeUserId });
    
    if (!userEmail || !kindeUserId) {
      console.log('❌ Missing user email or ID');
      return;
    }

    try {
      // Check if the user is a sub-user using the API endpoint
      console.log('🔍 Checking if user is a sub-user...');
      const subUserResponse = await fetch("/api/subscription-users");
      if (!subUserResponse.ok) {
        console.warn("⚠️ Failed to check sub-user status, proceeding with subscription check");
        // Don't throw error, continue with subscription check
      } else {
        const subUserData = await subUserResponse.json();
        
        console.log('📊 Sub-user check result:', { subUserData });
        
        // Check if current user is a sub-user
        if (subUserData.isSubUser) {
          console.log('✅ User is a sub-user, checking User table...');
          // Check if the user already exists in the User table
          try {
            const userCheckResponse = await fetch(`/api/admin/user-management?email=${encodeURIComponent(userEmail)}`);
            if (userCheckResponse.ok) {
              const userCheckResult = await userCheckResponse.json();
              const existingUser = userCheckResult.user;
              
              console.log('📊 Existing user check result:', { existingUser });

              if (existingUser) {
                console.log('🔄 Updating existing user role to sub-user...');
                // User exists, update their role to "sub-user"
                const updateResponse = await fetch('/api/admin/user-management', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: userEmail, role: "sub-user" })
                });

                if (updateResponse.ok) {
                  console.log("✅ User role updated to sub-user:", userEmail);
                } else {
                  console.warn("⚠️ Error updating user role, but continuing as sub-user");
                }
              } else {
                console.log('➕ Inserting new sub-user...');
                // User does not exist, insert them as a sub-user
                const insertResponse = await fetch('/api/admin/user-management', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    kindeUserId,
                    email: userEmail,
                    role: "sub-user"
                  })
                });

                if (insertResponse.ok) {
                  console.log("✅ Sub-user inserted successfully:", userEmail);
                } else {
                  console.warn("⚠️ Error inserting sub-user, but continuing as sub-user");
                }
              }
            } else {
              console.warn("⚠️ Error checking user existence, but continuing as sub-user");
            }
          } catch (error) {
            console.warn("⚠️ Error in user management operations, but continuing as sub-user:", error);
          }

          // Allow sub-user to access the dashboard regardless of database errors
          console.log('✅ Sub-user access granted');
          setIsSubscriptionCheckComplete(true);
          fetchData(); // Fetch data after successful check
          return;
        }
      }

      // If not a sub-user, check for an active subscription
      console.log('🔍 Checking for active subscription...');
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();
      console.log('📊 Subscription check result:', data);

      if (data.error || data.status === 'no_customer' || data.status === 'no_subscription' || data.status === 'no_items') {
        console.log('❌ No active subscription, redirecting to subscribe page');
        router.push("/subscribe");
      } else {
        console.log('✅ Active subscription found');
        setIsSubscriptionCheckComplete(true);
        fetchData(); // Fetch data after successful check
      }
    } catch (error) {
      console.error("❌ Critical error in subscription check:", error);
      // Only redirect to subscribe if we're certain the user is not a sub-user
      // For now, let's be more conservative and not redirect on errors
      // This prevents sub-users from being incorrectly redirected
      console.warn("⚠️ Error occurred during subscription check, allowing access to prevent sub-user redirects");
      setIsSubscriptionCheckComplete(true);
      fetchData(); // Fetch data after successful check
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use admin API endpoint to bypass RLS
      const response = await fetch('/api/admin/rate-data');
      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }
      
      const data = await response.json();
      
      // Set provider alerts
      if (data.providerAlerts) {
        setAlerts(data.providerAlerts);
      }
      
      // Set legislative updates
      if (data.bills) {
        setBills(data.bills);
      }
      
      // Set state plan amendments
      if (data.statePlanAmendments) {
        setStatePlanAmendments(data.statePlanAmendments);
      }
      
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setAlerts([]);
      setBills([]);
      setStatePlanAmendments([]);
    } finally {
      setLoading(false);
    }
  };

  // Service lines logic - using the same approach as main page
  useEffect(() => {
    const fetchServiceCategories = async () => {
      try {
        const response = await fetch('/api/admin/service-categories');
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setServiceCategories(result.data);
            // Extract all service lines from all categories - same as main page
            const allServiceLines = new Set<string>();
            result.data.forEach((cat: any) => {
              if (cat.categories) {
                const lines = cat.categories.split(',').map((line: string) => line.trim()).filter((line: string) => line);
                lines.forEach((line: string) => allServiceLines.add(line));
              }
            });
            setServiceLines(Array.from(allServiceLines));
          }
        }
      } catch (error) {
        console.error('Error fetching service categories:', error);
      }
    };
    fetchServiceCategories();
  }, []);

  const uniqueServiceLines = useMemo(() => Array.from(new Set(serviceLines)).sort(), [serviceLines]);

  // Dynamic service lines based on selected states
  const availableProviderServiceLines = useMemo(() => {
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
      
      if (isInSelectedState) {
        // Add service lines from this alert
        const alertServiceLines = [alert.service_lines_impacted, alert.service_lines_impacted_1, alert.service_lines_impacted_2, alert.service_lines_impacted_3]
          .filter((line): line is string => line !== null && line !== undefined && line.toUpperCase() !== 'NULL');
        
        alertServiceLines.forEach(line => serviceLinesInSelectedStates.add(line));
      }
    });
    
    return Array.from(serviceLinesInSelectedStates).sort();
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
        const stateA = (a.state || "").trim();
        const stateB = (b.state || "").trim();
        return sortDirection.direction === 'asc' ? stateA.localeCompare(stateB) : stateB.localeCompare(stateA);
      } else if (sortDirection.field === 'Effective Date') {
        const dateA = (a['Effective Date'] || a.effective_date) ? new Date(a['Effective Date'] || a.effective_date || '').getTime() : 0;
        const dateB = (b['Effective Date'] || b.effective_date) ? new Date(b['Effective Date'] || b.effective_date || '').getTime() : 0;
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortDirection.field === 'Approval Date') {
        const dateA = (a['Approval Date'] || a.approval_date) ? new Date(a['Approval Date'] || a.approval_date || '').getTime() : 0;
        const dateB = (b['Approval Date'] || b.approval_date) ? new Date(b['Approval Date'] || b.approval_date || '').getTime() : 0;
        return sortDirection.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
  }, [statePlanAmendments, sortDirection]);

  // Update the filtered data logic to use sorted arrays and multi-select filters
  const filteredProviderAlerts = sortedProviderAlerts.filter((alert) => {
    const matchesSearch = !providerSearch || searchInFields(providerSearch, [
      alert.subject
    ]);

    // Multi-select state filtering
    const alertStateCode = reverseStateMap[alert.state || ''] || alert.state;
    const matchesState = selectedProviderStates.length === 0 || 
      (alertStateCode && selectedProviderStates.includes(alertStateCode)) || 
      selectedProviderStates.includes(alert.state || '');

    // Multi-select service line filtering
    const matchesServiceLine = selectedProviderServiceLines.length === 0 || 
      [
        alert.service_lines_impacted,
        alert.service_lines_impacted_1,
        alert.service_lines_impacted_2,
        alert.service_lines_impacted_3,
      ].some(line => line && selectedProviderServiceLines.includes(line));

    const matchesNewFilter = !showOnlyNew || isNew(alert.is_new);
    const matchesBlankServiceLines = !showOnlyBlankServiceLines || hasBlankServiceLines(alert);

    return matchesSearch && matchesState && matchesServiceLine && matchesNewFilter && matchesBlankServiceLines;
  });

  // Update the filteredLegislativeUpdates logic to include bill progress filter and multi-select filters
  const filteredLegislativeUpdates = sortedLegislativeUpdates.filter((bill) => {
    const matchesSearch = !legislativeSearch || searchInFields(legislativeSearch, [
      bill.name,
      bill.bill_number,
      bill.last_action,
      ...(bill.sponsor_list || [])
    ]);

    // Multi-select state filtering
    const billStateCode = reverseStateMap[bill.state || ''] || bill.state;
    const matchesState = selectedLegislativeStates.length === 0 || 
      (billStateCode && selectedLegislativeStates.includes(billStateCode)) || 
      selectedLegislativeStates.includes(bill.state || '');

    // Multi-select service line filtering
    const matchesServiceLine = selectedLegislativeServiceLines.length === 0 || 
      [
        bill.service_lines_impacted,
        bill.service_lines_impacted_1,
        bill.service_lines_impacted_2,
        bill.service_lines_impacted_3
      ].some(line => line && selectedLegislativeServiceLines.includes(line));

    const matchesBillProgress = !selectedBillProgress || 
      bill.bill_progress?.includes(selectedBillProgress);

    const matchesNewFilter = !showOnlyNew || isNew(bill.is_new);
    const matchesBlankServiceLines = !showOnlyBlankServiceLines || hasBlankServiceLines(bill);

    return matchesSearch && matchesState && matchesServiceLine && matchesBillProgress && matchesNewFilter && matchesBlankServiceLines;
  });

  // Filtering logic for state plan amendments
  const filteredStatePlanAmendments = sortedStatePlanAmendments.filter((spa) => {
    const matchesSearch = !spaSearch || searchInFields(spaSearch, [
      spa.subject,
      spa['Transmittal Number'] || spa.transmittal_number
    ]);

    // Multi-select state filtering
    const spaStateCode = reverseStateMap[spa.state || ''] || spa.state;
    const matchesState = selectedSpaStates.length === 0 || 
      (spaStateCode && selectedSpaStates.includes(spaStateCode)) || 
      selectedSpaStates.includes(spa.state || '');

    // Multi-select service line filtering
    const matchesServiceLine = selectedSpaServiceLines.length === 0 || 
      [
        spa.service_lines_impacted,
        spa.service_lines_impacted_1,
        spa.service_lines_impacted_2,
        spa.service_lines_impacted_3,
      ].some(line => line && selectedSpaServiceLines.includes(line));

    const matchesNewFilter = !showOnlyNew || isNew(spa.is_new);
    const matchesBlankServiceLines = !showOnlyBlankServiceLines || hasBlankServiceLines(spa);

    return matchesSearch && matchesState && matchesServiceLine && matchesNewFilter && matchesBlankServiceLines;
  });

  const getServiceLines = (bill: Bill) => {
    const lines = [
      bill.service_lines_impacted,
      bill.service_lines_impacted_1,
      bill.service_lines_impacted_2,
      bill.service_lines_impacted_3
    ]
      .filter((line): line is string => !!line && line.toUpperCase() !== 'NULL');
    
    if (lines.length === 0) {
      return <span className="text-gray-400 italic">No service lines</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {lines.map((line, index) => (
          <span
            key={index}
            className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md border border-green-200"
            title={line}
          >
            {line.length > 20 ? `${line.substring(0, 20)}...` : line}
          </span>
        ))}
      </div>
    );
  };

  const getSpaServiceLines = (spa: StatePlanAmendment) => {
    const lines = [
      spa.service_lines_impacted,
      spa.service_lines_impacted_1,
      spa.service_lines_impacted_2,
      spa.service_lines_impacted_3,
    ]
      .filter((line): line is string => !!line && line.toUpperCase() !== 'NULL');
    
    if (lines.length === 0) {
      return <span className="text-gray-400 italic">No service lines</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {lines.map((line, index) => (
          <span
            key={index}
            className="inline-block px-2 py-1 text-xs bg-green-50 text-green-700 rounded-md border border-green-200"
            title={line}
          >
            {line.length > 20 ? `${line.substring(0, 20)}...` : line}
          </span>
        ))}
      </div>
    );
  };

  // Function to handle click on bill name
  const handleBillClick = (bill: Bill) => {
    if (bill.ai_summary) {
      setPopupContent(bill.ai_summary);
      setPopupTitle("AI Summary");
      setShowPopup(true);
    }
  };

  // Add edit state at the top of the component
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editingProviderValues, setEditingProviderValues] = useState<Partial<Alert>>({});
  const [editingBillUrl, setEditingBillUrl] = useState<string | null>(null);
  const [editingBillValues, setEditingBillValues] = useState<Partial<Bill>>({});
  const [sponsorListEdit, setSponsorListEdit] = useState<string>("");
  const [editingSpaId, setEditingSpaId] = useState<string | null>(null);
  const [editingSpaValues, setEditingSpaValues] = useState<Partial<StatePlanAmendment>>({});
  const [editingSpaServiceLines, setEditingSpaServiceLines] = useState<string[]>([]);
  
  // Add delete confirmation states
  const [deleteProviderId, setDeleteProviderId] = useState<string | null>(null);
  const [deleteBillUrl, setDeleteBillUrl] = useState<string | null>(null);
  const [deleteSpaId, setDeleteSpaId] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Update the save functions to handle multiple service lines with protection
  const handleSaveProviderEdit = async () => {
    const prevAlert = alerts.find(a => a.id === editingProviderId);
    
    // Only update service lines if they were actually changed by the user
    let serviceLinesData = {};
    if (prevAlert) {
      const currentServiceLines = [
        prevAlert.service_lines_impacted,
        prevAlert.service_lines_impacted_1,
        prevAlert.service_lines_impacted_2,
        prevAlert.service_lines_impacted_3
      ].filter(line => line && line.toUpperCase() !== 'NULL');
      
      const newServiceLines = editingProviderServiceLines.filter(line => line && line.trim() !== '');
      
      // Check if service lines actually changed
      const serviceLinesChanged = 
        currentServiceLines.length !== newServiceLines.length ||
        currentServiceLines.some((line, index) => line !== newServiceLines[index]);
      
      if (serviceLinesChanged) {
        serviceLinesData = {
          service_lines_impacted: editingProviderServiceLines[0] || null,
          service_lines_impacted_1: editingProviderServiceLines[1] || null,
          service_lines_impacted_2: editingProviderServiceLines[2] || null,
        };
        console.log('Service lines changed, updating:', serviceLinesData);
      } else {
        console.log('Service lines unchanged, preserving existing values');
      }
    }
    
    setAlerts(alerts =>
      alerts.map(alert =>
        alert.id === editingProviderId
          ? { ...alert, ...editingProviderValues, ...serviceLinesData }
          : alert
      )
    );
    
    if (editingProviderId) {
      const updateData = { ...editingProviderValues, ...serviceLinesData };
      console.log('Updating provider alert with:', updateData);
      
      try {
        const response = await fetch('/api/admin/update-provider-alert', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProviderId, ...updateData })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update provider alert:', errorData);
          alert(`❌ Failed to update provider alert: ${errorData.error || 'Unknown error'}`);
        } else {
          console.log('✅ Provider alert updated successfully');
        }
      } catch (error) {
        console.error('Error updating provider alert:', error);
        alert('❌ Error updating provider alert');
      }
    }
    
    // Highlight changed cells
    if (prevAlert) {
      const changed: string[] = [];
      Object.keys({ ...editingProviderValues, ...serviceLinesData }).forEach(key => {
        if ((prevAlert as any)[key] !== (editingProviderValues as any)[key]) {
          changed.push(key);
        }
      });
      if (changed.length > 0) {
        setHighlightedCells(cells => ({ ...cells, [editingProviderId!]: changed }));
      }
    }
    setEditingProviderId(null);
    setEditingProviderValues({});
    setEditingProviderServiceLines([]);
  };

  const handleSaveBillEdit = async () => {
    const sponsorListArray = sponsorListEdit.split(",").map(s => s.trim()).filter(Boolean);
    const prevBill = bills.find(b => b.url === editingBillUrl);
    
    // Only update service lines if they were actually changed by the user
    let serviceLinesData = {};
    if (prevBill) {
      const currentServiceLines = [
        prevBill.service_lines_impacted,
        prevBill.service_lines_impacted_1,
        prevBill.service_lines_impacted_2,
        prevBill.service_lines_impacted_3
      ].filter(line => line && line.toUpperCase() !== 'NULL');
      
      const newServiceLines = editingBillServiceLines.filter(line => line && line.trim() !== '');
      
      // Check if service lines actually changed
      const serviceLinesChanged = 
        currentServiceLines.length !== newServiceLines.length ||
        currentServiceLines.some((line, index) => line !== newServiceLines[index]);
      
      if (serviceLinesChanged) {
        serviceLinesData = {
          service_lines_impacted: editingBillServiceLines[0] || null,
          service_lines_impacted_1: editingBillServiceLines[1] || null,
          service_lines_impacted_2: editingBillServiceLines[2] || null,
        };
        console.log('Service lines changed, updating:', serviceLinesData);
      } else {
        console.log('Service lines unchanged, preserving existing values');
      }
    }
    
    setBills(bills =>
      bills.map(bill =>
        bill.url === editingBillUrl
          ? { ...bill, ...editingBillValues, sponsor_list: sponsorListArray, ...serviceLinesData }
          : bill
      )
    );
    
    if (editingBillUrl) {
      const updateData = { ...editingBillValues, sponsor_list: sponsorListArray, ...serviceLinesData };
      console.log('Updating bill with:', updateData);
      
      try {
        const response = await fetch('/api/admin/update-bill', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: editingBillUrl, ...updateData })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update bill:', errorData);
          alert(`❌ Failed to update bill: ${errorData.error || 'Unknown error'}`);
        } else {
          console.log('✅ Bill updated successfully');
        }
      } catch (error) {
        console.error('Error updating bill:', error);
        alert('❌ Error updating bill');
      }
    }
    
    // Highlight changed cells
    if (prevBill) {
      const changed: string[] = [];
      Object.keys({ ...editingBillValues, ...serviceLinesData }).forEach(key => {
        if ((prevBill as any)[key] !== (editingBillValues as any)[key]) {
          changed.push(key);
        }
      });
      if (changed.length > 0) {
        setHighlightedCells(cells => ({ ...cells, [editingBillUrl!]: changed }));
      }
    }
    setEditingBillUrl(null);
    setEditingBillValues({});
    setSponsorListEdit("");
    setEditingBillServiceLines([]);
  };

  const handleSaveCategoryEdit = async () => {
    if (!editingCategoryId) return;
    
    try {
      const response = await fetch('/api/admin/service-categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: editingCategoryId, 
          categories: editingCategoryValue 
        })
      });
      
      if (response.ok) {
        setServiceCategories(cats =>
          cats.map(cat =>
            cat.id === editingCategoryId ? { ...cat, categories: editingCategoryValue } : cat
          )
        );
        setEditingCategoryId(null);
        setEditingCategoryValue("");
      } else {
        console.error('Failed to update service category');
        alert('❌ Failed to update service category');
      }
    } catch (error) {
      console.error('Error updating service category:', error);
      alert('❌ Error updating service category');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const response = await fetch('/api/admin/service-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: newCategory.trim() })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setServiceCategories(cats => [...cats, result.data]);
          setNewCategory("");
        }
      } else {
        console.error('Failed to add service category');
        alert('❌ Failed to add service category');
      }
    } catch (error) {
      console.error('Error adding service category:', error);
      alert('❌ Error adding service category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
          try {
        const response = await fetch('/api/admin/service-categories', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        });
        
        if (!response.ok) {
          console.error('Failed to delete service category');
        }
      } catch (error) {
        console.error('Error deleting service category:', error);
      }
    setServiceCategories(cats => cats.filter(cat => cat.id !== id));
  };

  // Add delete functions for provider alerts and bills
  const handleDeleteProvider = async () => {
    if (!deleteProviderId) return;
    
    try {
      const response = await fetch('/api/admin/delete-provider-alert', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteProviderId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete provider alert:', errorData);
        alert(`❌ Failed to delete provider alert: ${errorData.error || 'Unknown error'}`);
      } else {
        console.log('✅ Provider alert deleted successfully');
        setAlerts(alerts => alerts.filter(alert => alert.id !== deleteProviderId));
      }
    } catch (error) {
      console.error('Error deleting provider alert:', error);
      alert('❌ Error deleting provider alert');
    } finally {
      setDeleteProviderId(null);
      setShowDeleteConfirmation(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!deleteBillUrl) return;
    
    try {
      const response = await fetch('/api/admin/delete-bill', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: deleteBillUrl })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete bill:', errorData);
        alert(`❌ Failed to delete bill: ${errorData.error || 'Unknown error'}`);
      } else {
        console.log('✅ Bill deleted successfully');
        setBills(bills => bills.filter(bill => bill.url !== deleteBillUrl));
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('❌ Error deleting bill');
    } finally {
      setDeleteBillUrl(null);
      setShowDeleteConfirmation(false);
    }
  };

  const confirmDelete = (type: 'provider' | 'bill' | 'spa', id: string) => {
    if (type === 'provider') {
      setDeleteProviderId(id);
    } else if (type === 'bill') {
      setDeleteBillUrl(id);
    } else {
      setDeleteSpaId(id);
    }
    setShowDeleteConfirmation(true);
  };

  // Save function for state plan amendments
  const handleSaveSpaEdit = async () => {
    const prevSpa = statePlanAmendments.find(s => s.id === editingSpaId);
    
    // Only update service lines if they were actually changed by the user
    let serviceLinesData = {};
    if (prevSpa) {
      const currentServiceLines = [
        prevSpa.service_lines_impacted,
        prevSpa.service_lines_impacted_1,
        prevSpa.service_lines_impacted_2,
        prevSpa.service_lines_impacted_3,
      ].filter(line => line && line.toUpperCase() !== 'NULL');
      
      const newServiceLines = editingSpaServiceLines.filter(line => line && line.trim() !== '');
      
      // Check if service lines actually changed
      const serviceLinesChanged = 
        currentServiceLines.length !== newServiceLines.length ||
        currentServiceLines.some((line, index) => line !== newServiceLines[index]);
      
      if (serviceLinesChanged) {
        serviceLinesData = {
          service_lines_impacted: editingSpaServiceLines[0] || null,
          service_lines_impacted_1: editingSpaServiceLines[1] || null,
          service_lines_impacted_2: editingSpaServiceLines[2] || null,
          service_lines_impacted_3: editingSpaServiceLines[3] || null,
        };
        console.log('Service lines changed, updating:', serviceLinesData);
      } else {
        console.log('Service lines unchanged, preserving existing values');
      }
    }
    
    setStatePlanAmendments(statePlanAmendments =>
      statePlanAmendments.map(spa =>
        spa.id === editingSpaId
          ? { ...spa, ...editingSpaValues, ...serviceLinesData }
          : spa
      )
    );
    
    if (editingSpaId) {
      const updateData = { ...editingSpaValues, ...serviceLinesData };
      console.log('Updating state plan amendment with:', updateData);
      
      try {
        const response = await fetch('/api/admin/update-state-plan-amendment', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSpaId, ...updateData })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to update state plan amendment:', errorData);
          alert(`❌ Failed to update SPA/Waiver Amendment: ${errorData.error || 'Unknown error'}`);
        } else {
          console.log('✅ State plan amendment updated successfully');
        }
      } catch (error) {
        console.error('Error updating state plan amendment:', error);
        alert('❌ Error updating SPA/Waiver Amendment');
      }
    }
    
    // Highlight changed cells
    if (prevSpa) {
      const changed: string[] = [];
      Object.keys({ ...editingSpaValues, ...serviceLinesData }).forEach(key => {
        if ((prevSpa as any)[key] !== (editingSpaValues as any)[key]) {
          changed.push(key);
        }
      });
      if (changed.length > 0) {
        setHighlightedCells(cells => ({ ...cells, [editingSpaId!]: changed }));
      }
    }
    setEditingSpaId(null);
    setEditingSpaValues({});
    setEditingSpaServiceLines([]);
  };

  // Delete function for state plan amendments
  const handleDeleteSpa = async () => {
    if (!deleteSpaId) return;
    
    try {
      const response = await fetch('/api/admin/delete-state-plan-amendment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteSpaId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to delete state plan amendment:', errorData);
        alert(`❌ Failed to delete SPA/Waiver Amendment: ${errorData.error || 'Unknown error'}`);
      } else {
        console.log('✅ State plan amendment deleted successfully');
        setStatePlanAmendments(statePlanAmendments => statePlanAmendments.filter(spa => spa.id !== deleteSpaId));
      }
    } catch (error) {
      console.error('Error deleting state plan amendment:', error);
      alert('❌ Error deleting SPA/Waiver Amendment');
    } finally {
      setDeleteSpaId(null);
      setShowDeleteConfirmation(false);
    }
  };

  // Function to handle click on alert subject
  const handleAlertClick = (alert: Alert) => {
    if (alert.summary) {
      setPopupContent(alert.summary);
      setPopupTitle("Summary");
      setShowPopup(true);
    }
  };

  if (isLoading || !isSubscriptionCheckComplete) {
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
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center mb-6 sm:mb-8">
          <FaChartLine className="h-8 w-8 text-[#012C61] mr-3" />
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase">
            Rate Developments - Edit Mode
          </h1>
        </div>

        {/* Search Bars and Filters Container */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col gap-4">

            {/* Advanced Multi-Select Filters - EXACT SAME AS MAIN PAGE */}
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
                    onChange={(option) => setSelectedBillProgress(option ? option.value : "")}
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
                        backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#dbeafe' : 'white',
                        color: state.isSelected ? 'white' : '#1f2937',
                        '&:hover': {
                          backgroundColor: state.isSelected ? '#3b82f6' : '#dbeafe'
                        }
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
                    options={uniqueServiceLines.map(line => ({ value: line, label: line }))}
                    placeholder="All Service Lines"
                  />
                </div>
              </div>
            </div>

            {/* Special Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={showOnlyNew}
                    onChange={(e) => setShowOnlyNew(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Show Only New Entries</span>
                </label>

                <label className="flex items-center space-x-2 text-gray-700">
                  <input
                    type="checkbox"
                    checked={showOnlyBlankServiceLines}
                    onChange={(e) => setShowOnlyBlankServiceLines(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">Show Only Blank Service Lines</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <FaExclamationCircle className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Provider Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <FaChartLine className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Filtered Provider Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{filteredProviderAlerts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <FaSpinner className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Legislative Bills</p>
                <p className="text-2xl font-bold text-gray-900">{bills.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <FaSort className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Filtered Legislative Bills</p>
                <p className="text-2xl font-bold text-gray-900">{filteredLegislativeUpdates.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Toggle Buttons and Table Switch */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setLayout("vertical")}
                className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
                  layout === "vertical" 
                    ? "bg-[#012C61] text-white shadow-lg" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <LayoutGrid size={20} className="mr-2" />
                <span>Vertical Layout</span>
              </button>
              <button
                onClick={() => setLayout("horizontal")}
                className={`px-4 py-2 rounded-lg flex items-center transition-all duration-200 ${
                  layout === "horizontal" 
                    ? "bg-[#012C61] text-white shadow-lg" 
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <LayoutList size={20} className="mr-2" />
                <span>Horizontal Layout</span>
              </button>
            </div>

            {/* Table Switch */}
            <div className={`flex items-center space-x-4 ${
              layout === "horizontal" ? "visible" : "invisible"
            }`}>
              <div className="flex bg-gray-100 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setActiveTable("provider")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTable === "provider"
                      ? "bg-white text-[#012C61] shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Provider Alerts ({filteredProviderAlerts.length})
                </button>
                <button
                  onClick={() => setActiveTable("legislative")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTable === "legislative"
                      ? "bg-white text-[#012C61] shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Legislative Updates ({filteredLegislativeUpdates.length})
                </button>
                <button
                  onClick={() => setActiveTable("spa")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTable === "spa"
                      ? "bg-white text-[#012C61] shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  SPA/Waiver Amendments ({filteredStatePlanAmendments.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start">
            <FaExclamationCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Edit Mode Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Click on column headings (State, Announcement Date, Action Date) to sort data</li>
                <li>Click the edit button (pencil icon) to modify entries</li>
                <li>Green highlighted rows indicate new entries</li>
                <li>Use filters to show only new entries or entries with blank service lines</li>
                <li>All changes are saved directly to the database</li>
              </ul>
            </div>
          </div>
        </div>

      {/* Tables */}
      {layout === "vertical" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Provider Alerts Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <h2 className="text-xl font-semibold text-[#012C61] flex items-center">
                <FaExclamationCircle className="mr-2" />
                Provider Alerts ({filteredProviderAlerts.length})
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('state')}>State {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('announcement_date')}>Announcement Date {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Subject</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b min-w-[200px]">Service Lines</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Is New</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviderAlerts.map((alert: any, idx: number) =>
                    editingProviderId === alert.id ? (
                      <tr key={alert.id} className={`${isNew(editingProviderValues.is_new ?? alert.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.state ?? alert.state ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, state: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.announcement_date ?? alert.announcement_date ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, announcement_date: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.subject ?? alert.subject ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, subject: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle">
                          <MultiServiceLinesDropdown
                            values={editingProviderServiceLines}
                            onChange={setEditingProviderServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 4)"
                            />
                          </td>
                        <td className="p-3 align-middle text-center">
                            <input
                            type="text"
                            value={editingProviderValues.is_new ?? alert.is_new ?? ''}
                            onChange={e => setEditingProviderValues({ ...editingProviderValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                            />
                          </td>
                        <td className="p-3 align-middle flex gap-2">
                          <button onClick={handleSaveProviderEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save</button>
                          <button onClick={() => { setEditingProviderId(null); setEditingProviderServiceLines([]); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel</button>
                          </td>
                      </tr>
                    ) : (
                      <tr key={alert.id} className={`${isNew(alert.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 align-middle">{alert.state}</td>
                        <td className="p-3 align-middle">{formatExcelOrStringDate(alert.announcement_date)}</td>
                        <td className="p-3 align-middle">
                          <div className="flex items-center">
                            <span
                              className={`${alert.summary ? 'cursor-pointer hover:underline' : ''}`}
                              onClick={() => {
                                if (alert.summary) {
                                  handleAlertClick(alert);
                                }
                              }}
                            >
                              {alert.subject}
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
                        <td className="p-3 align-middle">{getAlertServiceLines(alert)}</td>
                        <td className="p-3 align-middle text-center">{String(alert.is_new).trim()}</td>
                        <td className="p-3 align-middle">
                          <div className="flex gap-2">
                            <button onClick={() => { 
                              setEditingProviderId(alert.id); 
                              setEditingProviderValues({ ...alert }); 
                              // Robust deduplication for service lines
                              const lines = [
                                alert.service_lines_impacted,
                                alert.service_lines_impacted_1,
                                alert.service_lines_impacted_2,
                                alert.service_lines_impacted_3
                              ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                              const seen = new Set();
                              const uniqueLines = [];
                              for (const line of lines) {
                                const norm = line.trim().toLowerCase();
                                if (!seen.has(norm)) {
                                  seen.add(norm);
                                  uniqueLines.push(line.trim());
                                }
                              }
                              setEditingProviderServiceLines(uniqueLines);
                            }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                            </button>
                            <button onClick={() => confirmDelete('provider', alert.id)} className="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Delete">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z' /></svg>
                            </button>
                          </div>
                        </td>
                    </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legislative Updates Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
              <h2 className="text-xl font-semibold text-[#012C61] flex items-center">
                <FaChartLine className="mr-2" />
                Legislative Updates ({filteredLegislativeUpdates.length})
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
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
                    <th className="text-left p-4 font-semibold text-sm text-[#012C61] border-b">Is New</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegislativeUpdates.map((bill: any, idx: number) =>
                    editingBillUrl === bill.url ? (
                      <tr key={bill.url} className={`${isNew(editingBillValues.is_new ?? bill.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td><input type="text" value={editingBillValues.state ?? bill.state ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, state: e.target.value })} /></td>
                        <td><input type="text" value={editingBillValues.action_date ?? bill.action_date ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, action_date: e.target.value })} /></td>
                        <td><input type="text" value={editingBillValues.bill_number ?? bill.bill_number ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, bill_number: e.target.value })} /></td>
                        <td><input type="text" value={editingBillValues.name ?? bill.name ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, name: e.target.value })} /></td>
                        <td><input type="text" value={editingBillValues.last_action ?? bill.last_action ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, last_action: e.target.value })} /></td>
                        <td>
                          <input
                            type="text"
                            value={sponsorListEdit}
                            onChange={e => setSponsorListEdit(e.target.value)}
                          />
                        </td>
                        <td><input type="text" value={editingBillValues.bill_progress ?? bill.bill_progress ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, bill_progress: e.target.value })} /></td>
                        <td>
                          <MultiServiceLinesDropdown
                            values={editingBillServiceLines}
                            onChange={setEditingBillServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 4)"
                          />
                        </td>
                        <td className="p-3 align-middle text-center">
                          <input
                            type="text"
                            value={editingBillValues.is_new ?? bill.is_new ?? ''}
                            onChange={e => setEditingBillValues({ ...editingBillValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                          />
                        </td>
                        <td>
                          <button onClick={handleSaveBillEdit}>Save</button>
                          <button onClick={() => { setEditingBillUrl(null); setEditingBillServiceLines([]); }}>Cancel</button>
                        </td>
                    </tr>
                    ) : (
                      <tr key={bill.url} className={`${isNew(bill.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td>{reverseStateMap[bill.state] || bill.state}</td>
                        <td>{formatExcelOrStringDate(bill.action_date)}</td>
                        <td>{bill.bill_number}</td>
                        <td>{bill.name}</td>
                        <td>{bill.last_action}</td>
                        <td>{bill.sponsor_list}</td>
                        <td>{bill.bill_progress}</td>
                        <td>{getServiceLines(bill)}</td>
                        <td className="p-3 align-middle text-center">{String(bill.is_new).trim()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => { 
                              setEditingBillUrl(bill.url); 
                              setEditingBillValues({ ...bill }); 
                              setSponsorListEdit(Array.isArray(bill.sponsor_list) ? bill.sponsor_list.join(", ") : bill.sponsor_list ?? ""); 
                              // Robust deduplication for service lines
                              const lines = [
                                bill.service_lines_impacted,
                                bill.service_lines_impacted_1,
                                bill.service_lines_impacted_2,
                                bill.service_lines_impacted_3
                              ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                              const seen = new Set();
                              const uniqueLines = [];
                              for (const line of lines) {
                                const norm = line.trim().toLowerCase();
                                if (!seen.has(norm)) {
                                  seen.add(norm);
                                  uniqueLines.push(line.trim());
                                }
                              }
                              setEditingBillServiceLines(uniqueLines);
                            }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                            </button>
                            <button onClick={() => confirmDelete('bill', bill.url)} className="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Delete">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z' /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SPA/Waiver Amendments Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <h2 className="text-xl font-semibold text-[#012C61] flex items-center">
                <FaChartLine className="mr-2" />
                SPA/Waiver Amendments ({filteredStatePlanAmendments.length})
              </h2>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('state')}>State {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Transmittal Number</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Subject</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('Effective Date')}>Effective Date {sortDirection.field === 'Effective Date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('Approval Date')}>Approval Date {sortDirection.field === 'Approval Date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b min-w-[200px]">Service Lines</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Is New</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStatePlanAmendments.map((spa: any, idx: number) =>
                    editingSpaId === spa.id ? (
                      <tr key={spa.id} className={`${isNew(editingSpaValues.is_new ?? spa.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues.state ?? spa.state ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, state: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues['Transmittal Number'] ?? editingSpaValues.transmittal_number ?? spa['Transmittal Number'] ?? spa.transmittal_number ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, 'Transmittal Number': e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues.subject ?? spa.subject ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, subject: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues['Effective Date'] ?? editingSpaValues.effective_date ?? spa['Effective Date'] ?? spa.effective_date ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, 'Effective Date': e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues['Approval Date'] ?? editingSpaValues.approval_date ?? spa['Approval Date'] ?? spa.approval_date ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, 'Approval Date': e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle">
                          <MultiServiceLinesDropdown
                            values={editingSpaServiceLines}
                            onChange={setEditingSpaServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 4)"
                          />
                        </td>
                        <td className="p-3 align-middle text-center">
                          <input
                            type="text"
                            value={editingSpaValues.is_new ?? spa.is_new ?? ''}
                            onChange={e => setEditingSpaValues({ ...editingSpaValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                          />
                        </td>
                        <td className="p-3 align-middle flex gap-2">
                          <button onClick={handleSaveSpaEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save</button>
                          <button onClick={() => { setEditingSpaId(null); setEditingSpaServiceLines([]); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={spa.id} className={`${isNew(spa.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 align-middle">{spa.state}</td>
                        <td className="p-3 align-middle">{spa['Transmittal Number'] || spa.transmittal_number || ''}</td>
                        <td className="p-3 align-middle">
                          <div className="flex items-center">
                            <span>{spa.subject || ''}</span>
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
                        <td className="p-3 align-middle">{formatExcelOrStringDate(spa['Effective Date'] || spa.effective_date)}</td>
                        <td className="p-3 align-middle">{formatExcelOrStringDate(spa['Approval Date'] || spa.approval_date)}</td>
                        <td className="p-3 align-middle">{getSpaServiceLines(spa)}</td>
                        <td className="p-3 align-middle text-center">{String(spa.is_new || '').trim()}</td>
                        <td className="p-3 align-middle">
                          <div className="flex gap-2">
                            <button onClick={() => { 
                              setEditingSpaId(spa.id); 
                              setEditingSpaValues({ ...spa }); 
                              const lines = [
                                spa.service_lines_impacted,
                                spa.service_lines_impacted_1,
                                spa.service_lines_impacted_2,
                                spa.service_lines_impacted_3,
                              ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                              const seen = new Set();
                              const uniqueLines = [];
                              for (const line of lines) {
                                const norm = line.trim().toLowerCase();
                                if (!seen.has(norm)) {
                                  seen.add(norm);
                                  uniqueLines.push(line.trim());
                                }
                              }
                              setEditingSpaServiceLines(uniqueLines);
                            }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                            </button>
                            <button onClick={() => confirmDelete('spa', spa.id)} className="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Delete">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z' /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Table Heading */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-100">
            <h2 className="text-xl font-semibold text-[#012C61] flex items-center">
              {activeTable === "provider" ? (
                <>
                  <FaExclamationCircle className="mr-2" />
                  Provider Alerts ({filteredProviderAlerts.length})
                </>
              ) : activeTable === "legislative" ? (
                <>
                  <FaChartLine className="mr-2" />
                  Legislative Updates ({filteredLegislativeUpdates.length})
                </>
              ) : (
                <>
                  <FaChartLine className="mr-2" />
                  SPA/Waiver Amendments ({filteredStatePlanAmendments.length})
                </>
              )}
            </h2>
          </div>

          {/* Tables Container with Animation */}
          <div className="flex transition-transform duration-300 ease-in-out" style={{
            transform: `translateX(${activeTable === "provider" ? "0%" : activeTable === "legislative" ? "-100%" : "-200%"})`
          }}>
            {/* Provider Alerts Table */}
            <div className="min-w-full max-h-[600px] overflow-y-auto relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('state')}>State {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('announcement_date')}>Announcement Date {sortDirection.field === 'announcement_date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Subject</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b min-w-[200px]">Service Lines</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Is New</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProviderAlerts.map((alert: any, idx: number) =>
                    editingProviderId === alert.id ? (
                      <tr key={alert.id} className={`${isNew(editingProviderValues.is_new ?? alert.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.state ?? alert.state ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, state: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.announcement_date ?? alert.announcement_date ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, announcement_date: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingProviderValues.subject ?? alert.subject ?? ""} onChange={e => setEditingProviderValues({ ...editingProviderValues, subject: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle">
                          <MultiServiceLinesDropdown
                            values={editingProviderServiceLines}
                            onChange={setEditingProviderServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 4)"
                          />
                        </td>
                        <td className="p-3 align-middle text-center">
                          <input
                            type="text"
                            value={editingProviderValues.is_new ?? alert.is_new ?? ''}
                            onChange={e => setEditingProviderValues({ ...editingProviderValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                          />
                        </td>
                        <td className="p-3 align-middle flex gap-2">
                          <button onClick={handleSaveProviderEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save</button>
                          <button onClick={() => { setEditingProviderId(null); setEditingProviderServiceLines([]); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel</button>
                        </td>
                    </tr>
                    ) : (
                      <tr key={alert.id} className={`${isNew(alert.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 align-middle">{alert.state}</td>
                        <td className="p-3 align-middle">{formatExcelOrStringDate(alert.announcement_date)}</td>
                        <td className="p-3 align-middle">
                          <div className="flex items-center">
                            <span
                              className={`${alert.summary ? 'cursor-pointer hover:underline' : ''}`}
                              onClick={() => {
                                if (alert.summary) {
                                  handleAlertClick(alert);
                                }
                              }}
                            >
                              {alert.subject}
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
                        <td className="p-3 align-middle">{getAlertServiceLines(alert)}</td>
                        <td className="p-3 align-middle text-center">{String(alert.is_new).trim()}</td>
                        <td className="p-3 align-middle">
                          <div className="flex gap-2">
                            <button onClick={() => { 
                              setEditingProviderId(alert.id); 
                              setEditingProviderValues({ ...alert }); 
                              // Robust deduplication for service lines
                              const lines = [
                                alert.service_lines_impacted,
                                alert.service_lines_impacted_1,
                                alert.service_lines_impacted_2,
                                alert.service_lines_impacted_3
                              ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                              const seen = new Set();
                              const uniqueLines = [];
                              for (const line of lines) {
                                const norm = line.trim().toLowerCase();
                                if (!seen.has(norm)) {
                                  seen.add(norm);
                                  uniqueLines.push(line.trim());
                                }
                              }
                              setEditingProviderServiceLines(uniqueLines);
                            }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                            </button>
                            <button onClick={() => confirmDelete('provider', alert.id)} className="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Delete">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z' /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* Legislative Updates Table */}
            <div className="min-w-full max-h-[600px] overflow-y-auto relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">State</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Action Date</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Bill Number</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Bill Name</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Last Action</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Sponsors</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Progress</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b min-w-[200px]">Service Lines</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Is New</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLegislativeUpdates.map((bill: any, idx: number) =>
                    editingBillUrl === bill.url ? (
                      <tr key={bill.url} className={`${isNew(editingBillValues.is_new ?? bill.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.state ?? bill.state ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, state: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.action_date ?? bill.action_date ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, action_date: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.bill_number ?? bill.bill_number ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, bill_number: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.name ?? bill.name ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, name: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.last_action ?? bill.last_action ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, last_action: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={sponsorListEdit} onChange={e => setSponsorListEdit(e.target.value)} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingBillValues.bill_progress ?? bill.bill_progress ?? ""} onChange={e => setEditingBillValues({ ...editingBillValues, bill_progress: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle">
                          <MultiServiceLinesDropdown
                            values={editingBillServiceLines}
                            onChange={setEditingBillServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 4)"
                          />
                        </td>
                        <td className="p-3 align-middle text-center">
                          <input
                            type="text"
                            value={editingBillValues.is_new ?? bill.is_new ?? ''}
                            onChange={e => setEditingBillValues({ ...editingBillValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                          />
                        </td>
                        <td className="p-3 align-middle flex gap-2">
                          <button onClick={handleSaveBillEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save</button>
                          <button onClick={() => { setEditingBillUrl(null); setEditingBillServiceLines([]); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel</button>
                        </td>
                    </tr>
                    ) : (
                      <tr key={bill.url} className={`${isNew(bill.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 align-middle">{reverseStateMap[bill.state] || bill.state}</td>
                        <td className="p-3 align-middle">{formatExcelOrStringDate(bill.action_date)}</td>
                        <td className="p-3 align-middle">
                          {bill.url ? (
                            <a
                              href={bill.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {bill.bill_number}
                            </a>
                          ) : (
                            bill.bill_number
                          )}
                        </td>
                        <td className="p-3 align-middle">
                          <span
                            className={`${bill.ai_summary ? 'cursor-pointer hover:underline' : ''}`}
                            onClick={() => {
                              if (bill.ai_summary) {
                                handleBillClick(bill);
                              }
                            }}
                          >
                            {bill.name}
                          </span>
                        </td>
                        <td className="p-3 align-middle">{bill.last_action}</td>
                        <td className="p-3 align-middle">{Array.isArray(bill.sponsor_list) ? bill.sponsor_list.join(", ") : bill.sponsor_list}</td>
                        <td className="p-3 align-middle">{bill.bill_progress}</td>
                        <td className="p-3 align-middle">{getServiceLines(bill)}</td>
                        <td className="p-3 align-middle text-center">{String(bill.is_new).trim()}</td>
                        <td className="p-3 align-middle">
                          <div className="flex gap-2">
                            <button onClick={() => { 
                              setEditingBillUrl(bill.url); 
                              setEditingBillValues({ ...bill }); 
                              setSponsorListEdit(Array.isArray(bill.sponsor_list) ? bill.sponsor_list.join(", ") : bill.sponsor_list ?? ""); 
                              // Robust deduplication for service lines
                              const lines = [
                                bill.service_lines_impacted,
                                bill.service_lines_impacted_1,
                                bill.service_lines_impacted_2,
                                bill.service_lines_impacted_3
                              ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                              const seen = new Set();
                              const uniqueLines = [];
                              for (const line of lines) {
                                const norm = line.trim().toLowerCase();
                                if (!seen.has(norm)) {
                                  seen.add(norm);
                                  uniqueLines.push(line.trim());
                                }
                              }
                              setEditingBillServiceLines(uniqueLines);
                            }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                            </button>
                            <button onClick={() => confirmDelete('bill', bill.url)} className="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Delete">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z' /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* SPA/Waiver Amendments Table */}
            <div className="min-w-full max-h-[600px] overflow-y-auto relative">
              <table className="min-w-full bg-white border-collapse">
                <thead className="sticky top-0 bg-white shadow">
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('state')}>State {sortDirection.field === 'state' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Transmittal Number</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Subject</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('Effective Date')}>Effective Date {sortDirection.field === 'Effective Date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b cursor-pointer" onClick={() => toggleSort('Approval Date')}>Approval Date {sortDirection.field === 'Approval Date' && (sortDirection.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b min-w-[200px]">Service Lines</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Is New</th>
                    <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStatePlanAmendments.map((spa: any, idx: number) =>
                    editingSpaId === spa.id ? (
                      <tr key={spa.id} className={`${isNew(editingSpaValues.is_new ?? spa.is_new) ? 'bg-green-100' : 'bg-yellow-100'} border-b`}>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues.state ?? spa.state ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, state: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues['Transmittal Number'] ?? editingSpaValues.transmittal_number ?? spa['Transmittal Number'] ?? spa.transmittal_number ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, 'Transmittal Number': e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues.subject ?? spa.subject ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, subject: e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues['Effective Date'] ?? editingSpaValues.effective_date ?? spa['Effective Date'] ?? spa.effective_date ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, 'Effective Date': e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle"><input type="text" value={editingSpaValues['Approval Date'] ?? editingSpaValues.approval_date ?? spa['Approval Date'] ?? spa.approval_date ?? ""} onChange={e => setEditingSpaValues({ ...editingSpaValues, 'Approval Date': e.target.value })} className="border rounded px-2 py-1 w-full" /></td>
                        <td className="p-3 align-middle">
                          <MultiServiceLinesDropdown
                            values={editingSpaServiceLines}
                            onChange={setEditingSpaServiceLines}
                            options={normalizedServiceLineOptions}
                            placeholder="Select service lines (max 4)"
                          />
                        </td>
                        <td className="p-3 align-middle text-center">
                          <input
                            type="text"
                            value={editingSpaValues.is_new ?? spa.is_new ?? ''}
                            onChange={e => setEditingSpaValues({ ...editingSpaValues, is_new: e.target.value })}
                            className="border rounded px-2 py-1 w-full text-center"
                          />
                        </td>
                        <td className="p-3 align-middle flex gap-2">
                          <button onClick={handleSaveSpaEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save</button>
                          <button onClick={() => { setEditingSpaId(null); setEditingSpaServiceLines([]); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1"><svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel</button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={spa.id} className={`${isNew(spa.is_new) ? 'bg-green-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')} border-b hover:bg-blue-50 transition-colors`}>
                        <td className="p-3 align-middle">{spa.state}</td>
                        <td className="p-3 align-middle">{spa['Transmittal Number'] || spa.transmittal_number || ''}</td>
                        <td className="p-3 align-middle">
                          <div className="flex items-center">
                            <span>{spa.subject || ''}</span>
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
                        <td className="p-3 align-middle">{formatExcelOrStringDate(spa['Effective Date'] || spa.effective_date)}</td>
                        <td className="p-3 align-middle">{formatExcelOrStringDate(spa['Approval Date'] || spa.approval_date)}</td>
                        <td className="p-3 align-middle">{getSpaServiceLines(spa)}</td>
                        <td className="p-3 align-middle text-center">{String(spa.is_new || '').trim()}</td>
                        <td className="p-3 align-middle">
                          <div className="flex gap-2">
                            <button onClick={() => { 
                              setEditingSpaId(spa.id); 
                              setEditingSpaValues({ ...spa }); 
                              const lines = [
                                spa.service_lines_impacted,
                                spa.service_lines_impacted_1,
                                spa.service_lines_impacted_2,
                                spa.service_lines_impacted_3,
                              ].filter(line => line && line.toUpperCase().trim() !== 'NULL');
                              const seen = new Set();
                              const uniqueLines = [];
                              for (const line of lines) {
                                const norm = line.trim().toLowerCase();
                                if (!seen.has(norm)) {
                                  seen.add(norm);
                                  uniqueLines.push(line.trim());
                                }
                              }
                              setEditingSpaServiceLines(uniqueLines);
                            }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                            </button>
                            <button onClick={() => confirmDelete('spa', spa.id)} className="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Delete">
                              <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z' /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Popup for AI Summary */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-lg w-full">
            <h3 className="text-lg font-bold">
              {popupTitle || "Summary"}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <div className="flex items-center mb-4">
              <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24' stroke='currentColor' className="text-red-600 mr-3">
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' />
              </svg>
              <h3 className="text-lg font-bold text-gray-900">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this {deleteProviderId ? 'provider alert' : deleteBillUrl ? 'legislative bill' : 'SPA/Waiver Amendment'}? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setDeleteProviderId(null);
                  setDeleteBillUrl(null);
                  setDeleteSpaId(null);
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteProviderId ? handleDeleteProvider : deleteBillUrl ? handleDeleteBill : handleDeleteSpa}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Service Category List Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
            <h2 className="text-xl font-semibold text-[#012C61] flex items-center">
              <FaFilter className="mr-2" />
              Service Category List
            </h2>
          </div>
          
          <div className="p-6">
            <div className="flex gap-2 mb-4">
              <input
                className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add new service category"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
              />
              <button
                className="bg-[#012C61] hover:bg-[#004aad] text-white px-6 py-2 rounded-lg transition-colors duration-200"
                onClick={handleAddCategory}
              >
                Add Category
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">ID</th>
              <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Category</th>
              <th className="p-3 text-left font-semibold text-[#012C61] bg-gray-100 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {serviceCategories.map((cat, idx) => (
              <tr key={cat.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b`}>
                <td className="p-3 align-middle">{cat.id}</td>
                <td className="p-3 align-middle">
                  {editingCategoryId === cat.id ? (
                    <input
                      type="text"
                      value={editingCategoryValue}
                      onChange={e => setEditingCategoryValue(e.target.value)}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    cat.categories
                  )}
                </td>
                <td className="p-3 align-middle">
                  {editingCategoryId === cat.id ? (
                    <div className="flex gap-2">
                      <button onClick={handleSaveCategoryEdit} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1">
                        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>Save
                  </button>
                      <button onClick={() => { setEditingCategoryId(null); setEditingCategoryValue(""); }} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded flex items-center gap-1">
                        <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCategoryId(cat.id); setEditingCategoryValue(cat.categories); }} className="text-blue-600 hover:bg-blue-100 p-2 rounded transition" title="Edit">
                        <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z' /></svg>
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 hover:bg-red-100 p-2 rounded transition" title="Delete">
                        <svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M10 3h4a1 1 0 011 1v2H9V4a1 1 0 011-1z' /></svg>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>


    </AppLayout>
  );
} 