"use client";

import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { 
  fetchEnhancedMetrics, 
  getMasterDataRecords, 
  getProviderAlerts, 
  getLegislativeUpdates,
  getServiceCategories,
  getStateSummary,
  EnhancedMetricsData,
  MasterDataRecord,
  ProviderAlert,
  LegislativeUpdate,
  ServiceCategory
} from "@/lib/enhanced-metrics";
import { 
  fetchRecentRateChanges,
  getRecentRateChanges,
  filterRecentRateChanges,
  getRecentRateChangesSummary,
  RecentRateChangesData,
  RecentRateChange
} from "@/lib/enhanced-metrics";
import LoaderOverlay from "@/app/components/LoaderOverlay";

interface RateChange {
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

export default function RecentRateChangesPage() {
  const auth = useProtectedPage();
  const router = useRouter();

  // State for data
  const [enhancedData, setEnhancedData] = useState<EnhancedMetricsData | null>(null);
  const [recentRateData, setRecentRateData] = useState<RecentRateChangesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for filters
  const [filters, setFilters] = useState({
    serviceCategory: '',
    state: '',
    durationUnit: ''
  });

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load enhanced metrics data
        const enhanced = await fetchEnhancedMetrics();
        if (enhanced) {
          setEnhancedData(enhanced);
        }

        // Load recent rate changes data
        const recent = await fetchRecentRateChanges();
        if (recent) {
          setRecentRateData(recent);
        }

        if (!enhanced && !recent) {
          setError('Failed to load data from both sources');
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (auth.isAuthenticated) {
      loadData();
    }
  }, [auth.isAuthenticated]);

  // Process rate changes from enhanced data
  const processRateChangesFromEnhancedData = (data: EnhancedMetricsData): RateChange[] => {
    const masterRecords = getMasterDataRecords(data);
    
    // Group records by service code and state to identify changes
    const groupedRecords = masterRecords.reduce((acc, record) => {
      const key = `${record.service_code}-${record.state_name}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(record);
      return acc;
    }, {} as Record<string, MasterDataRecord[]>);

    const rateChanges: RateChange[] = [];

    // Process each group to find rate changes
    Object.values(groupedRecords).forEach(records => {
      if (records.length < 2) return; // Need at least 2 records to show a change

      // Sort by effective date
      const sortedRecords = records.sort((a, b) => {
        const dateA = new Date(a.rate_effective_date || '');
        const dateB = new Date(b.rate_effective_date || '');
        return dateA.getTime() - dateB.getTime();
      });

      // Compare consecutive records
      for (let i = 1; i < sortedRecords.length; i++) {
        const oldRecord = sortedRecords[i - 1];
        const newRecord = sortedRecords[i];

        if (oldRecord.rate && newRecord.rate && oldRecord.rate !== newRecord.rate) {
          const oldRate = parseFloat(oldRecord.rate.replace(/[^0-9.-]/g, '')) || 0;
          const newRate = parseFloat(newRecord.rate.replace(/[^0-9.-]/g, '')) || 0;
          const percentageChange = oldRate > 0 ? ((newRate - oldRate) / oldRate) * 100 : 0;

          const modifiers = [
            oldRecord.modifier_1,
            oldRecord.modifier_2,
            oldRecord.modifier_3,
            oldRecord.modifier_4
          ].filter(Boolean) as string[];

          rateChanges.push({
            id: `${oldRecord.service_code}-${oldRecord.state_name}-${oldRecord.rate_effective_date}-${i}`,
            serviceCode: oldRecord.service_code || '',
            description: oldRecord.service_description || '',
            state: oldRecord.state_name || '',
            serviceCategory: oldRecord.service_category || '',
            oldRate: oldRecord.rate || '',
            newRate: newRecord.rate || '',
            percentageChange,
            effectiveDate: newRecord.rate_effective_date || '',
            modifiers,
            providerType: oldRecord.provider_type || '',
            program: oldRecord.program || '',
            locationRegion: oldRecord.location_region || '',
            durationUnit: oldRecord.duration_unit || ''
          });
        }
      }
    });

    return rateChanges;
  };

  // Get rate changes from both sources
  const allRateChanges = useMemo(() => {
    const changes: RateChange[] = [];

    // Add recent rate changes if available
    if (recentRateData) {
      const recentChanges = getRecentRateChanges(recentRateData);
      changes.push(...recentChanges);
    }

    // Add enhanced data changes if available
    if (enhancedData) {
      const enhancedChanges = processRateChangesFromEnhancedData(enhancedData);
      changes.push(...enhancedChanges);
    }

    // Remove duplicates based on id
    const uniqueChanges = changes.filter((change, index, self) => 
      index === self.findIndex(c => c.id === change.id)
    );

    return uniqueChanges;
  }, [recentRateData, enhancedData]);

  // Filter rate changes
  const filteredRateChanges = useMemo(() => {
    return allRateChanges.filter(change => {
      if (filters.serviceCategory && change.serviceCategory.toLowerCase() !== filters.serviceCategory.toLowerCase()) {
        return false;
      }
      if (filters.state && change.state.toLowerCase() !== filters.state.toLowerCase()) {
        return false;
      }
      if (filters.durationUnit && change.durationUnit.toLowerCase() !== filters.durationUnit.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [allRateChanges, filters]);

  // Paginate results
  const paginatedRateChanges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRateChanges.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRateChanges, currentPage, itemsPerPage]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (filteredRateChanges.length === 0) {
      return {
        totalChanges: 0,
        averagePercentageChange: 0,
        statesWithChanges: 0,
        categoriesWithChanges: 0,
        topStates: [],
        topCategories: []
      };
    }

    const totalChanges = filteredRateChanges.length;
    const averagePercentageChange = filteredRateChanges.reduce((sum, change) => sum + change.percentageChange, 0) / totalChanges;

    const states = new Set(filteredRateChanges.map(c => c.state));
    const categories = new Set(filteredRateChanges.map(c => c.serviceCategory));

    const stateCounts = filteredRateChanges.reduce((acc, change) => {
      acc[change.state] = (acc[change.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topStates = Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const categoryCounts = filteredRateChanges.reduce((acc, change) => {
      acc[change.serviceCategory] = (acc[change.serviceCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalChanges,
      averagePercentageChange,
      statesWithChanges: states.size,
      categoriesWithChanges: categories.size,
      topStates,
      topCategories
    };
  }, [filteredRateChanges]);

  // Get unique filter options
  const filterOptions = useMemo(() => {
    const serviceCategories = Array.from(new Set(allRateChanges.map(c => c.serviceCategory))).sort();
    const states = Array.from(new Set(allRateChanges.map(c => c.state))).sort();
    const durationUnits = Array.from(new Set(allRateChanges.map(c => c.durationUnit))).sort();

    return {
      serviceCategories,
      states,
      durationUnits
    };
  }, [allRateChanges]);

  // Handle filter changes
  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format rate
  const formatRate = (rate: string) => {
    if (!rate) return '-';
    const numericRate = parseFloat(rate.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericRate)) return rate;
    return `$${numericRate.toFixed(2)}`;
  };

  // Loading state
  if (auth.isLoading || auth.shouldRedirect) {
    return <LoaderOverlay />;
  }

  // Error state
  if (error) {
    return (
      <AppLayout activeTab="home">
        <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab="home">
      <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-3 sm:mb-0">Recent Rate Changes</h1>
            <p className="text-gray-600">Track recent changes in service rates across states and service categories</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Changes</h3>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.totalChanges.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Avg. % Change</h3>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.averagePercentageChange.toFixed(1)}%</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">States Affected</h3>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.statesWithChanges}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Service Categories</h3>
              <p className="text-2xl font-bold text-gray-900">{summaryStats.categoriesWithChanges}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
                <select
                  value={filters.serviceCategory}
                  onChange={(e) => handleFilterChange('serviceCategory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {filterOptions.serviceCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All States</option>
                  {filterOptions.states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration Unit</label>
                <select
                  value={filters.durationUnit}
                  onChange={(e) => handleFilterChange('durationUnit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Units</option>
                  {filterOptions.durationUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading rate changes...</span>
            </div>
          )}

          {/* Results */}
          {!loading && (
            <>
              {/* Results Summary */}
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Rate Changes</h3>
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRateChanges.length)} of {filteredRateChanges.length} results
                  </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRateChanges.map((change) => (
                        <tr key={change.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{change.serviceCode}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={change.description}>{change.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{change.state}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{change.serviceCategory}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(change.oldRate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatRate(change.newRate)}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            change.percentageChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {change.percentageChange > 0 ? '+' : ''}{change.percentageChange.toFixed(1)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(change.effectiveDate)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{change.providerType || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredRateChanges.length > itemsPerPage && (
                  <div className="mt-6 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm text-gray-700">
                        Page {currentPage} of {Math.ceil(filteredRateChanges.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(filteredRateChanges.length / itemsPerPage)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>

              {/* Top States and Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top States by Changes</h3>
                  <div className="space-y-3">
                    {summaryStats.topStates.map(({ state, count }) => (
                      <div key={state} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{state}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Service Categories</h3>
                  <div className="space-y-3">
                    {summaryStats.topCategories.map(({ category, count }) => (
                      <div key={category} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{category}</span>
                        <span className="text-sm font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </AppLayout>
  );
}
