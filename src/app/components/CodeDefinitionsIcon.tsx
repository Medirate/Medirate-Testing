"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Modal from './modal';
import { FaInfoCircle, FaSearch, FaTimes } from 'react-icons/fa';

interface CodeDefinition {
  hcpcs_code_cpt_code: string;
  service_code: string;
  service_description: string;
}

interface ModifierDefinition {
  modifier_code: string;
  modifier_details: string;
  usage_count: number;
}

// Column Filter Dropdown Component
interface ColumnFilterDropdownProps {
  columnKey: string;
  data: CodeDefinition[];
  currentFilters: string[];
  onFilterChange: (selectedValues: string[]) => void;
  getUniqueValues: (data: CodeDefinition[], key: keyof CodeDefinition) => string[];
  placeholder: string;
}

const ColumnFilterDropdown: React.FC<ColumnFilterDropdownProps> = ({
  columnKey,
  data,
  currentFilters,
  onFilterChange,
  getUniqueValues,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get unique values for this column
  const uniqueValues = getUniqueValues(data, columnKey as keyof CodeDefinition);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onFilterChange([...currentFilters, value]);
    } else {
      onFilterChange(currentFilters.filter(f => f !== value));
    }
  };

  const clearFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`ml-2 p-1 rounded hover:bg-gray-200 transition-colors ${
          currentFilters.length > 0 ? 'text-blue-600 bg-blue-50' : 'text-gray-400'
        }`}
        title={`Filter ${placeholder}`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Filter {placeholder}</span>
              {currentFilters.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto">
            {uniqueValues.map((value) => (
              <label
                key={value}
                className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={currentFilters.includes(value)}
                  onChange={(e) => handleCheckboxChange(value, e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 truncate">{value}</span>
              </label>
            ))}
          </div>
          
          {currentFilters.length > 0 && (
            <div className="p-2 border-t border-gray-200 text-xs text-gray-500">
              {currentFilters.length} selected
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const CodeDefinitionsIcon = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [topPosition, setTopPosition] = useState('4rem');
  const [showTooltip, setShowTooltip] = useState(true);
  const [data, setData] = useState<CodeDefinition[]>([]);
  const [modifierData, setModifierData] = useState<ModifierDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [modifierLoading, setModifierLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modifierError, setModifierError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modifierSearchTerm, setModifierSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'codes' | 'modifiers'>('codes');
  
  // Column filters
  interface ColumnFilter {
    codeType: string[];
    serviceCode: string[];
  }
  
  const [columnFilters, setColumnFilters] = useState<ColumnFilter>({
    codeType: [],
    serviceCode: []
  });
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  
  // Handle column filter changes
  const handleColumnFilterChange = (columnKey: keyof ColumnFilter, selectedValues: string[]) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: selectedValues
    }));
  };
  
  // Helper function to get unique values for a column
  const getUniqueValues = (data: CodeDefinition[], key: keyof CodeDefinition): string[] => {
    const unique = Array.from(new Set(data.map(item => item[key]).filter(Boolean)));
    return unique.sort();
  };
  const navbarRef = useRef<HTMLElement | null>(null);

  // Filtered data based on search term and column filters
  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const code = item.service_code?.toLowerCase() || '';
        const description = item.service_description?.toLowerCase() || '';
        return code.includes(lowerCaseSearch) || description.includes(lowerCaseSearch);
      });
    }
    
    // Apply column filters
    if (columnFilters.codeType.length > 0) {
      filtered = filtered.filter(item => 
        columnFilters.codeType.includes(item.hcpcs_code_cpt_code)
      );
    }
    
    if (columnFilters.serviceCode.length > 0) {
      filtered = filtered.filter(item => 
        columnFilters.serviceCode.includes(item.service_code)
      );
    }
    
    return filtered;
  }, [data, searchTerm, columnFilters]);

  // Filtered modifier data based on search term
  const filteredModifierData = useMemo(() => {
    let filtered = modifierData;
    
    // Apply search filter for modifiers
    if (modifierSearchTerm) {
      const lowerCaseSearch = modifierSearchTerm.toLowerCase();
      filtered = filtered.filter(item => {
        const code = item.modifier_code?.toLowerCase() || '';
        const details = item.modifier_details?.toLowerCase() || '';
        return code.includes(lowerCaseSearch) || details.includes(lowerCaseSearch);
      });
    }
    
    return filtered;
  }, [modifierData, modifierSearchTerm]);

  // Add useEffect for initial data fetch
  useEffect(() => {
    if (!hasAttemptedFetch && isOpen) {
      console.log('🔍 CodeDefinitionsIcon - Opening modal, fetching data...');
      fetchData();
      fetchModifierData();
      setHasAttemptedFetch(true);
    }
  }, [isOpen, hasAttemptedFetch]);

  useEffect(() => {
    const updatePosition = () => {
      const navbar = document.querySelector('nav');
      if (navbar) {
        const navbarHeight = navbar.offsetHeight;
        setTopPosition(`${navbarHeight + 16}px`); // 16px below the navbar
      }
    };

    // Initial position update
    updatePosition();

    // Update position on window resize
    window.addEventListener('resize', updatePosition);

    // Cleanup
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  const fetchData = async () => {
    try {
      console.log('🚀 CodeDefinitionsIcon - Starting data fetch...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/code-definations');
      console.log('📡 CodeDefinitionsIcon - API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 CodeDefinitionsIcon - API response data length:', result?.length || 0);
      
      // Ensure the data is an array and not empty
      if (Array.isArray(result) && result.length > 0) {
        // Remove duplicates based on service_code
        const uniqueData = result.filter((item, index, self) =>
          index === self.findIndex((t) => t.service_code === item.service_code)
        );
        console.log('✅ CodeDefinitionsIcon - Setting data:', uniqueData.length, 'unique items');
        setData(uniqueData);
      } else {
        throw new Error('No data received from API');
      }
    } catch (error) {
      console.error('❌ CodeDefinitionsIcon - Fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load code definitions. Please try again later.');
      setData([]); // Reset data to empty array
    } finally {
      console.log('🏁 CodeDefinitionsIcon - Fetch completed, setting loading to false');
      setLoading(false);
    }
  };

  const fetchModifierData = async () => {
    try {
      console.log('🚀 CodeDefinitionsIcon - Starting modifier data fetch...');
      setModifierLoading(true);
      setModifierError(null);
      
      const response = await fetch('/api/modifiers');
      console.log('📡 CodeDefinitionsIcon - Modifier API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch modifier data: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('📊 CodeDefinitionsIcon - Modifier API response data length:', result?.length || 0);
      
      // Ensure the data is an array
      if (Array.isArray(result)) {
        console.log('✅ CodeDefinitionsIcon - Setting modifier data:', result.length, 'modifiers');
        setModifierData(result);
      } else {
        throw new Error('No modifier data received from API');
      }
    } catch (error) {
      console.error('❌ CodeDefinitionsIcon - Modifier fetch error:', error);
      setModifierError(error instanceof Error ? error.message : 'Failed to load modifiers. Please try again later.');
      setModifierData([]); // Reset data to empty array
    } finally {
      console.log('🏁 CodeDefinitionsIcon - Modifier fetch completed, setting loading to false');
      setModifierLoading(false);
    }
  };

  const handleIconInteraction = () => {
    setShowTooltip(false);
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleIconInteraction}
        style={{ top: topPosition }}
        className="fixed right-4 z-[1000] px-4 py-2 bg-[#012C61] text-white rounded-lg shadow-lg hover:bg-[#001a3d] transition-colors flex items-center space-x-2"
        aria-label="View Code Definitions"
      >
        <FaInfoCircle className="h-5 w-5" />
        <span>Code Definitions</span>
      </button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => {
          setIsOpen(false);
          setSearchTerm(''); // Reset search when closing
          setModifierSearchTerm(''); // Reset modifier search when closing
          setActiveTab('codes'); // Reset to codes tab
        }} 
        width="max-w-4xl"
        className="z-[1001]"
      >
        <div className="p-6 flex flex-col h-[80vh]">
          {/* Centered Heading */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-[#012C61] uppercase font-lemonMilkRegular">
              Code Definitions
            </h2>
            <div className="text-sm text-gray-600 mt-1">
              {activeTab === 'codes' ? (
                data.length > 0 ? (
                  <>
                    {data.length.toLocaleString()} total codes loaded
                    {filteredData.length !== data.length && (
                      <span className="text-blue-600"> ({filteredData.length.toLocaleString()} shown)</span>
                    )}
                  </>
                ) : (
                  'Loading codes...'
                )
              ) : (
                modifierData.length > 0 ? (
                  <>
                    {modifierData.length.toLocaleString()} total modifiers loaded
                    {filteredModifierData.length !== modifierData.length && (
                      <span className="text-blue-600"> ({filteredModifierData.length.toLocaleString()} shown)</span>
                    )}
                  </>
                ) : (
                  'Loading modifiers...'
                )
              )}
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="mb-4">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('codes')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'codes'
                    ? 'bg-white text-[#012C61] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                CPT/HCPCS Codes
              </button>
              <button
                onClick={() => setActiveTab('modifiers')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'modifiers'
                    ? 'bg-white text-[#012C61] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Modifiers
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mb-4 relative">
            <input
              type="text"
              placeholder={activeTab === 'codes' ? "Search by code or description..." : "Search by modifier code or details..."}
              value={activeTab === 'codes' ? searchTerm : modifierSearchTerm}
              onChange={(e) => {
                if (activeTab === 'codes') {
                  setSearchTerm(e.target.value);
                } else {
                  setModifierSearchTerm(e.target.value);
                }
              }}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {((activeTab === 'codes' && searchTerm) || (activeTab === 'modifiers' && modifierSearchTerm)) && (
              <button
                onClick={() => {
                  if (activeTab === 'codes') {
                    setSearchTerm('');
                  } else {
                    setModifierSearchTerm('');
                  }
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Clear search"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'codes' ? (
              // CPT/HCPCS Codes Tab
              loading ? (
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-3 text-gray-600 text-center">Loading all code definitions...</span>
                  <span className="text-xs text-gray-400 mt-2 text-center">Fetching data in batches for better performance</span>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{error}</p>
                  <button 
                    onClick={fetchData}
                    className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700">
                    {searchTerm ? 'No matching code definitions found' : 'No code definitions available'}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          Code Type
                          <ColumnFilterDropdown
                            columnKey="hcpcs_code_cpt_code"
                            data={data}
                            currentFilters={columnFilters.codeType}
                            onFilterChange={(values) => handleColumnFilterChange('codeType', values)}
                            getUniqueValues={getUniqueValues}
                            placeholder="Code Type"
                          />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          Service Code
                          <ColumnFilterDropdown
                            columnKey="service_code"
                            data={data}
                            currentFilters={columnFilters.serviceCode}
                            onFilterChange={(values) => handleColumnFilterChange('serviceCode', values)}
                            getUniqueValues={getUniqueValues}
                            placeholder="Service Code"
                          />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <tr key={`${item.service_code}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.hcpcs_code_cpt_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                          {item.service_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.service_description?.trim()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              // Modifiers Tab
              modifierLoading ? (
                <div className="flex flex-col justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <span className="ml-3 text-gray-600 text-center">Loading modifiers...</span>
                  <span className="text-xs text-gray-400 mt-2 text-center">Fetching modifier data from database</span>
                </div>
              ) : modifierError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{modifierError}</p>
                  <button 
                    onClick={fetchModifierData}
                    className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredModifierData.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-700">
                    {modifierSearchTerm ? 'No matching modifiers found' : 'No modifiers available'}
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Modifier Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usage Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredModifierData.map((item, index) => (
                      <tr key={`${item.modifier_code}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 font-mono">
                            {item.modifier_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.modifier_details}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.usage_count.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CodeDefinitionsIcon; 