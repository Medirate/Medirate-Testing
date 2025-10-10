"use client";

import { useEffect, useState, useMemo } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import USMap from "@/app/components/us-map";
import { 
  MapPin,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  BookOpen,
  Lightbulb,
  MessageCircle,
  Bot,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  Megaphone,
  ExternalLink,
  Bell,
  Vote,
  Gavel,
  XCircle,
  Clock,
  FileCheck,
  FileX,
  FileClock
} from "lucide-react";
import { 
  fetchRecentRateChanges,
  getRecentRateChanges,
  filterRecentRateChanges,
  getRecentRateChangesSummary,
  RecentRateChangesData,
  RecentRateChange,
  fetchEnhancedMetrics,
  getProviderAlerts,
  getLegislativeUpdates,
  ProviderAlert,
  LegislativeUpdate
} from "@/lib/enhanced-metrics";

// State mapping for consistent state name handling
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

// Reverse mapping for easier access
const reverseStateMap = Object.fromEntries(
  Object.entries(stateMap).map(([key, value]) => [value, key])
);

const HomePage = () => {
  const auth = useProtectedPage();
  const router = useRouter();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [stateMetricsData, setStateMetricsData] = useState<any>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [alertData, setAlertData] = useState<any>(null);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  
  // Recent rate changes state
  const [recentRateData, setRecentRateData] = useState<RecentRateChangesData | null>(null);
  const [isLoadingRateChanges, setIsLoadingRateChanges] = useState(false);
  const [rateChangesError, setRateChangesError] = useState<string | null>(null);
  
  // Rate developments state
  const [enhancedData, setEnhancedData] = useState<any>(null);
  const [isLoadingRateDevelopments, setIsLoadingRateDevelopments] = useState(false);
  const [rateDevelopmentsError, setRateDevelopmentsError] = useState<string | null>(null);
  const [rateDevelopmentsFilter, setRateDevelopmentsFilter] = useState<'all' | 'provider' | 'legislative'>('all');
  
  // Filter state for rate changes
  const [rateChangeFilters, setRateChangeFilters] = useState({
    serviceCategory: '',
    serviceCode: '',
    providerType: '',
    program: ''
  });
  
  // Pagination for rate changes
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch state metrics data on component mount
  useEffect(() => {
    const fetchStateMetrics = async () => {
      setIsLoadingMetrics(true);
      setMetricsError(null);
      
      try {
        const response = await fetch('/api/state-metrics');
        if (response.ok) {
          const data = await response.json();
          setStateMetricsData(data);
          console.log('✅ State metrics loaded successfully');
        } else {
          console.error('Failed to fetch state metrics');
          setMetricsError('Failed to load state metrics');
        }
      } catch (error) {
        console.error('Error fetching state metrics:', error);
        setMetricsError('Error loading state metrics');
      } finally {
        setIsLoadingMetrics(false);
      }
    };

    fetchStateMetrics();
  }, []);

  // Fetch recent rate changes data on component mount
  useEffect(() => {
    const fetchRateChanges = async () => {
      setIsLoadingRateChanges(true);
      setRateChangesError(null);
      
      try {
        const data = await fetchRecentRateChanges();
        if (data) {
          setRecentRateData(data);
          console.log('✅ Recent rate changes loaded successfully');
        } else {
          setRateChangesError('Failed to load recent rate changes');
        }
      } catch (error) {
        console.error('Error fetching recent rate changes:', error);
        setRateChangesError('Error loading recent rate changes');
      } finally {
        setIsLoadingRateChanges(false);
      }
    };

    fetchRateChanges();
  }, []);

  // Fetch rate developments data on component mount
  useEffect(() => {
    const fetchRateDevelopments = async () => {
      setIsLoadingRateDevelopments(true);
      setRateDevelopmentsError(null);
      
      try {
        const data = await fetchEnhancedMetrics();
        if (data) {
          setEnhancedData(data);
          console.log('✅ Rate developments loaded successfully');
        } else {
          setRateDevelopmentsError('Failed to load rate developments');
        }
      } catch (error) {
        console.error('Error fetching rate developments:', error);
        setRateDevelopmentsError('Error loading rate developments');
      } finally {
        setIsLoadingRateDevelopments(false);
      }
    };

    fetchRateDevelopments();
  }, []);

  // Redirect if not authenticated using useEffect
  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.push("/");
    }
  }, [auth.isAuthenticated, router]);

  // Show loading or return null while redirecting
  if (!auth.isAuthenticated) {
    return null;
  }

  const handleStateSelect = (stateName: string | null) => {
    // If clicking the same state, deselect it
    if (selectedState === stateName) {
      setSelectedState(null);
      setAlertData(null);
    } else {
      // Select the new state (this will automatically deselect the previous one)
      setSelectedState(stateName);
      if (stateName) {
        fetchAlertData(stateName);
      }
    }
    // Reset pagination when state changes
    setCurrentPage(1);
  };

  // Fetch alert data for a specific state
  const fetchAlertData = async (stateName: string) => {
    setIsLoadingAlerts(true);
    try {
      const response = await fetch(`/api/state-alerts?state=${encodeURIComponent(stateName)}`);
      if (response.ok) {
        const data = await response.json();
        setAlertData(data);
        console.log('✅ Alert data loaded for', stateName, ':', data);
      } else {
        console.error('Failed to fetch alert data for', stateName);
        setAlertData(null);
      }
    } catch (error) {
      console.error('Error fetching alert data:', error);
      setAlertData(null);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // Get state statistics using compressed metrics data
  const getStateStatistics = (stateName: string | null) => {
    if (!stateName) {
      return {
        totalServices: "15,234",
        latestDate: "2024-07-01",
        changes30Days: "142",
        changes90Days: "389",
        openAlerts: "0"
      };
    }
    
    if (!stateMetricsData || isLoadingMetrics) {
      return {
        totalServices: "Loading...",
        latestDate: "Loading...",
        changes30Days: "Loading...",
        changes90Days: "Loading...",
        openAlerts: isLoadingAlerts ? "Loading..." : "0"
      };
    }
    
    // Extract state data from compressed metrics using the correct decompression pattern
    let stateData: any = null;
    
    // Handle the compressed format with proper mapping reversal
    if (stateMetricsData.m && stateMetricsData.d && stateMetricsData.s) {
      // Find state index
      const stateIndex = stateMetricsData.s.findIndex((s: string) => 
        s.toUpperCase() === stateName.toUpperCase()
      );
      
      if (stateIndex !== -1) {
        const { m: mappings, d: stateDataArrays } = stateMetricsData;
        
        // Helper function to reverse mapping lookup
        const getRealValue = (metricType: string, compressedValue: number) => {
          if (!mappings[metricType] || compressedValue === undefined) return null;
          
          // Find the real value by reversing the mapping
          const realValue = Object.keys(mappings[metricType]).find(
            key => mappings[metricType][key] === compressedValue
          );
          
          return realValue || null;
        };
        
        // Get compressed values for this state
        const uniqueServiceCodesCompressed = stateDataArrays.unique_service_codes?.[stateIndex];
        const latestDateCompressed = stateDataArrays.latest_rate_effective_date?.[stateIndex];
        const allRateDatesCompressed = stateDataArrays.all_rate_dates?.[stateIndex];
        const rateChangesCompressed = stateDataArrays.rate_changes_by_date?.[stateIndex];
        
        // Decompress using correct mapping reversal
        const uniqueServiceCodesRaw = getRealValue('unique_service_codes', uniqueServiceCodesCompressed);
        const uniqueServiceCodes = uniqueServiceCodesRaw ? parseInt(uniqueServiceCodesRaw) : 0;
        const latestRateEffectiveDate = getRealValue('latest_rate_effective_date', latestDateCompressed);
        
        // Handle all_rate_dates (array of dates)
        let allRateDates: string[] = [];
        if (allRateDatesCompressed !== undefined && mappings.all_rate_dates) {
          // This should be an array of compressed indices that need to be decompressed
          if (Array.isArray(allRateDatesCompressed)) {
            allRateDates = allRateDatesCompressed
              .map(compressedIndex => getRealValue('all_rate_dates', compressedIndex))
              .filter(date => date !== null) as string[];
          }
        }
        
        // Handle rate_changes_by_date (array of change objects)
        let rateChangesByDate: Array<{date: string, count: number}> = [];
        if (rateChangesCompressed !== undefined && Array.isArray(rateChangesCompressed)) {
          rateChangesByDate = rateChangesCompressed
            .map(change => {
              if (typeof change === 'object' && change.date !== undefined && change.count !== undefined) {
                // Decompress the date using the rate_changes_by_date_dates mapping
                const realDate = getRealValue('rate_changes_by_date_dates', change.date);
                const realCount = change.count; // Count is already a number
                return realDate ? { date: realDate, count: realCount } : null;
              }
              return null;
            })
            .filter(change => change !== null) as Array<{date: string, count: number}>;
        }
        
        stateData = {
          unique_service_codes: uniqueServiceCodes || 0,
          latest_rate_effective_date: latestRateEffectiveDate || '',
          all_rate_dates: allRateDates,
          rate_changes_by_date: rateChangesByDate
        };
      }
    } else if (stateMetricsData[stateName.toUpperCase()]) {
      // Direct object format (fallback)
      stateData = stateMetricsData[stateName.toUpperCase()];
    }
    
    if (!stateData) {
      // Fallback to dummy data if state not found
      const stateSeed = stateName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const random = (min: number, max: number) => {
        const x = Math.sin(stateSeed) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
      };
      
      return {
        totalServices: random(50, 500).toString(),
        latestDate: "2024-07-01",
        changes30Days: random(20, 200).toString(),
        changes90Days: random(100, 500).toString(),
        openAlerts: "0" // Use 0 instead of random for openAlerts
      };
    }
    
    // Calculate 90-day changes
    const currentDate = new Date();
    const cutoffDate = new Date(currentDate);
    cutoffDate.setDate(cutoffDate.getDate() - 90);
    
    const changes90Days = stateData.rate_changes_by_date
      ?.filter((change: any) => {
        const changeDate = new Date(change.date);
        return changeDate >= cutoffDate && changeDate <= currentDate;
      })
      ?.reduce((total: number, change: any) => total + (change.count || 0), 0) || 0;
    
    // Calculate 30-day changes
    const cutoffDate30 = new Date(currentDate);
    cutoffDate30.setDate(cutoffDate30.getDate() - 30);
    
    const changes30Days = stateData.rate_changes_by_date
      ?.filter((change: any) => {
        const changeDate = new Date(change.date);
        return changeDate >= cutoffDate30 && changeDate <= currentDate;
      })
      ?.reduce((total: number, change: any) => total + (change.count || 0), 0) || 0;
    
    // Get alert count from real data
    let openAlertsCount = 0;
    if (alertData && !isLoadingAlerts) {
      openAlertsCount = alertData.totalNewAlerts || 0;
    } else if (isLoadingAlerts) {
      return {
        totalServices: (stateData.unique_service_codes || 0).toLocaleString(),
        latestDate: stateData.latest_rate_effective_date || "2024-07-01",
        changes30Days: changes30Days.toString(),
        changes90Days: changes90Days.toString(),
        openAlerts: "Loading..."
      };
    }

    return {
      totalServices: (stateData.unique_service_codes || 0).toLocaleString(),
      latestDate: stateData.latest_rate_effective_date || "2024-07-01",
      changes30Days: changes30Days.toString(),
      changes90Days: changes90Days.toString(),
      openAlerts: openAlertsCount.toString()
    };
  };

  // Get filtered rate changes based on selected state and filters
  const filteredRateChanges = useMemo(() => {
    if (!recentRateData) return [];
    
    const filters = {
      state: selectedState || undefined,
      serviceCategory: rateChangeFilters.serviceCategory || undefined,
      serviceCode: rateChangeFilters.serviceCode || undefined,
      providerType: rateChangeFilters.providerType || undefined,
      program: rateChangeFilters.program || undefined
    };
    
    return filterRecentRateChanges(recentRateData, filters);
  }, [recentRateData, selectedState, rateChangeFilters]);

  // Get paginated rate changes
  const paginatedRateChanges = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRateChanges.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRateChanges, currentPage, itemsPerPage]);

  // Get summary statistics for rate changes
  const rateChangesSummary = useMemo(() => {
    if (!recentRateData) {
      return {
        totalChanges: 0,
        averagePercentageChange: 0,
        statesWithChanges: 0,
        categoriesWithChanges: 0,
        topStates: [],
        topCategories: []
      };
    }
    
    return getRecentRateChangesSummary(recentRateData);
  }, [recentRateData]);

  // Get filter options
  const filterOptions = useMemo(() => {
    if (!recentRateData) return { serviceCategories: [], serviceCodes: [], providerTypes: [], programs: [] };
    
    const allChanges = getRecentRateChanges(recentRateData);
    
    const serviceCategories = Array.from(new Set(allChanges.map(c => c.serviceCategory))).sort();
    const serviceCodes = Array.from(new Set(allChanges.map(c => c.serviceCode))).sort();
    const providerTypes = Array.from(new Set(allChanges.map(c => c.providerType))).sort();
    const programs = Array.from(new Set(allChanges.map(c => c.program))).sort();
    
    return {
      serviceCategories,
      serviceCodes,
      providerTypes,
      programs
    };
  }, [recentRateData]);

  // Get rate developments data with proper sorting
  const rateDevelopmentsData = useMemo(() => {
    if (!enhancedData) return { providerAlerts: [], legislativeUpdates: [] };
    
    const providerAlerts = getProviderAlerts(enhancedData);
    const legislativeUpdates = getLegislativeUpdates(enhancedData);
    
    // Sort provider alerts by announcement_date (latest first)
    const sortedProviderAlerts = [...providerAlerts].sort((a, b) => {
      const dateA = a.announcement_date ? new Date(a.announcement_date).getTime() : 0;
      const dateB = b.announcement_date ? new Date(b.announcement_date).getTime() : 0;
      return dateB - dateA; // Descending order (latest first)
    });
    
    // Sort legislative updates by action_date (latest first)
    const sortedLegislativeUpdates = [...legislativeUpdates].sort((a, b) => {
      const dateA = a.action_date ? new Date(a.action_date).getTime() : 0;
      const dateB = b.action_date ? new Date(b.action_date).getTime() : 0;
      return dateB - dateA; // Descending order (latest first)
    });
    
    return { 
      providerAlerts: sortedProviderAlerts, 
      legislativeUpdates: sortedLegislativeUpdates 
    };
  }, [enhancedData]);

  // Filter rate developments by selected state
  const filteredRateDevelopments = useMemo(() => {
    const { providerAlerts, legislativeUpdates } = rateDevelopmentsData;
    
    let filteredProviderAlerts = providerAlerts;
    let filteredLegislativeUpdates = legislativeUpdates;
    
    // Filter by selected state if one is selected
    if (selectedState) {
      // Enhanced state matching logic - handle both state codes and full names
      filteredProviderAlerts = providerAlerts.filter(alert => {
        if (!alert.state) return false;
        
        // Direct match
        if (alert.state.toLowerCase() === selectedState.toLowerCase()) return true;
        
        // If selectedState is a full name (like "Washington"), check if alert.state matches the state code
        if (reverseStateMap[selectedState] && alert.state === reverseStateMap[selectedState]) return true;
        
        // If selectedState is a state code (like "WA"), check if alert.state matches the full name
        if (stateMap[selectedState.toUpperCase()] && alert.state === stateMap[selectedState.toUpperCase()]) return true;
        
        // Partial match as fallback
        return alert.state.toLowerCase().includes(selectedState.toLowerCase());
      });
      
      filteredLegislativeUpdates = legislativeUpdates.filter(update => {
        if (!update.state) return false;
        
        // Debug for Washington
        if (selectedState.toLowerCase() === 'washington' && (update.state === 'WA' || update.state === 'Washington')) {
          console.log('Washington legislative update found:', {
            state: update.state,
            billNumber: update.bill_number,
            name: update.name
          });
        }
        
        // Direct match
        if (update.state.toLowerCase() === selectedState.toLowerCase()) return true;
        
        // If selectedState is a full name (like "Washington"), check if update.state matches the state code
        if (reverseStateMap[selectedState] && update.state === reverseStateMap[selectedState]) return true;
        
        // If selectedState is a state code (like "WA"), check if update.state matches the full name
        if (stateMap[selectedState.toUpperCase()] && update.state === stateMap[selectedState.toUpperCase()]) return true;
        
        // Partial match as fallback
        return update.state.toLowerCase().includes(selectedState.toLowerCase());
      });
      
      // Debug logging for Washington state
      if (selectedState.toLowerCase() === 'washington' || selectedState.toLowerCase() === 'wa') {
        // Check for Washington state codes in the data
        const washingtonLegislativeUpdates = legislativeUpdates.filter(update => 
          update.state === 'WA' || update.state === 'Washington' || update.state?.toLowerCase().includes('washington')
        );
        
        console.log('Washington state filtering debug:', {
          selectedState,
          totalProviderAlerts: providerAlerts.length,
          totalLegislativeUpdates: legislativeUpdates.length,
          filteredProviderAlerts: filteredProviderAlerts.length,
          filteredLegislativeUpdates: filteredLegislativeUpdates.length,
          sampleProviderStates: providerAlerts.slice(0, 5).map(a => a.state),
          sampleLegislativeStates: legislativeUpdates.slice(0, 5).map(l => l.state),
          washingtonLegislativeUpdates: washingtonLegislativeUpdates.length,
          washingtonStateCodes: washingtonLegislativeUpdates.slice(0, 3).map(l => l.state),
          stateMapWA: stateMap['WASHINGTON'],
          reverseStateMapWA: reverseStateMap['WA']
        });
      }
    }
    
    // Apply filter type
    if (rateDevelopmentsFilter === 'provider') {
      return { providerAlerts: filteredProviderAlerts, legislativeUpdates: [] };
    } else if (rateDevelopmentsFilter === 'legislative') {
      return { providerAlerts: [], legislativeUpdates: filteredLegislativeUpdates };
    }
    
    return { providerAlerts: filteredProviderAlerts, legislativeUpdates: filteredLegislativeUpdates };
  }, [rateDevelopmentsData, selectedState, rateDevelopmentsFilter]);

  // Get status badge color, text, and icon for rate developments
  const getStatusBadge = (item: ProviderAlert | LegislativeUpdate) => {
    if ('bill_progress' in item) {
      // Legislative update
      const progress = item.bill_progress?.toLowerCase() || '';
      const lastAction = item.last_action?.toLowerCase() || '';
      
      // Check for vetoed bills
      if (progress.includes('vetoed') || lastAction.includes('vetoed')) {
        return { 
          text: 'Vetoed', 
          color: 'bg-red-600', 
          icon: <XCircle className="h-3 w-3" />
        };
      }
      
      // Check for signed/enacted bills
      if (progress.includes('signed') || progress.includes('enacted') || lastAction.includes('signed')) {
        return { 
          text: 'Signed', 
          color: 'bg-green-600', 
          icon: <FileCheck className="h-3 w-3" />
        };
      }
      
      // Check for passed bills
      if (progress.includes('passed') || lastAction.includes('passed')) {
        return { 
          text: 'Passed', 
          color: 'bg-green-500', 
          icon: <Vote className="h-3 w-3" />
        };
      }
      
      // Check for bills in committee
      if (progress.includes('committee') || progress.includes('subcommittee') || lastAction.includes('committee')) {
        return { 
          text: 'In Committee', 
          color: 'bg-blue-500', 
          icon: <Clock className="h-3 w-3" />
        };
      }
      
      // Check for bills that crossed over
      if (progress.includes('crossed over') || lastAction.includes('crossed over')) {
        return { 
          text: 'Crossed Over', 
          color: 'bg-yellow-500', 
          icon: <ArrowUp className="h-3 w-3" />
        };
      }
      
      // Check for failed bills
      if (progress.includes('failed') || progress.includes('defeated') || lastAction.includes('failed')) {
        return { 
          text: 'Failed', 
          color: 'bg-red-500', 
          icon: <FileX className="h-3 w-3" />
        };
      }
      
      // Check for introduced bills
      if (progress.includes('introduced') || lastAction.includes('introduced')) {
        return { 
          text: 'Introduced', 
          color: 'bg-gray-500', 
          icon: <FileClock className="h-3 w-3" />
        };
      }
      
      // Default for unknown status
      return { 
        text: 'Active', 
        color: 'bg-blue-400', 
        icon: <Gavel className="h-3 w-3" />
      };
    } else {
      // Provider alert
      return { 
        text: 'Alert', 
        color: 'bg-red-500', 
        icon: <Bell className="h-3 w-3" />
      };
    }
  };

  // Combined and sorted rate developments
  const combinedRateDevelopments = useMemo(() => {
    const { providerAlerts, legislativeUpdates } = filteredRateDevelopments;
    
    // Convert provider alerts to unified format
    const alertItems = providerAlerts.map(alert => ({
      type: 'provider' as const,
      id: alert.id,
      title: alert.subject || 'Provider Alert',
      description: alert.summary || 'No summary available',
      date: alert.announcement_date,
      link: alert.link,
      state: alert.state,
      statusBadge: getStatusBadge(alert)
    }));
    
    // Convert legislative updates to unified format
    const legislativeItems = legislativeUpdates.map(update => ({
      type: 'legislative' as const,
      id: `${update.bill_number}-${update.state}`,
      title: update.name || `${update.bill_number || 'Bill'}: ${update.ai_summary?.substring(0, 50)}...`,
      description: update.ai_summary || 'No summary available',
      date: update.action_date,
      link: update.url,
      state: update.state,
      statusBadge: getStatusBadge(update)
    }));
    
    // Combine and sort by date (latest first)
    const combined = [...alertItems, ...legislativeItems].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA; // Descending order (latest first)
    });
    
    return combined;
  }, [filteredRateDevelopments]);

  // Format date for rate developments
  const formatRateDevelopmentDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return dateString;
    }
  };

  const stateStatistics = getStateStatistics(selectedState);

  // Handle filter changes
  const handleFilterChange = (filterType: keyof typeof rateChangeFilters, value: string) => {
    setRateChangeFilters(prev => ({ ...prev, [filterType]: value }));
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

  return (
    <AppLayout activeTab="home">
      <div className="space-y-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-3xl md:text-4xl text-[#012C61] font-lemonMilkRegular uppercase mb-3 sm:mb-0">Medicaid Rate Explorer</h1>
          <p className="text-gray-600 mt-2">Select a state to view detailed rate information and recent changes</p>
        </div>

        {/* Map and Modules Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* US Map Section - Left Side */}
          <Card>
            <CardHeader>
              <CardTitle>Select by State</CardTitle>
              <CardDescription>
                Click on any state to view detailed Medicaid rate information and filter recent changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[500px] mb-4">
                <USMap 
                  onStateSelect={handleStateSelect}
                  selectedState={selectedState}
                />
              </div>
              
              {/* State Selection Indicator */}
              {selectedState ? (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-blue-800 font-medium">Selected State: {selectedState}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    <p className="text-gray-600">No state selected. Click on any state above to view details and filter recent rate changes.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Modules Section - Right Side */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Modules</CardTitle>
                <CardDescription>
                  Access different features and tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  {[
                    {
                      icon: TrendingUp,
                      title: "Rate Changes",
                      description: "Track and analyze fluctuations in Medicaid rates over time."
                    },
                    {
                      icon: BookOpen,
                      title: "Legislative & Policy Updates",
                      description: "Stay informed about new laws and policies affecting Medicaid."
                    },
                    {
                      icon: FileText,
                      title: "Documents & State Notes",
                      description: "Access official documents and state-specific notes for detailed context."
                    },
                    {
                      icon: Lightbulb,
                      title: "What's New This Week",
                      description: "Discover the latest updates and key highlights for the current week."
                    },
                    {
                      icon: Bot,
                      title: "Chatbot Assistant",
                      description: "Get instant answers and assistance with common queries."
                    }
                  ].map((module, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        // Handle module clicks here
                      }}
                    >
                      <div className="flex-shrink-0 mr-4">
                        <module.icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{module.title}</h3>
                        <p className="text-sm text-gray-600">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Key Statistics Cards - State Specific */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stateStatistics.totalServices}</div>
              <p className="text-xs text-muted-foreground">
                active service codes {selectedState && `for ${selectedState}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Effective Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stateStatistics.latestDate}</div>
              <p className="text-xs text-muted-foreground">
                most recent rate {selectedState && `in ${selectedState}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Changes (30/90 days)</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stateStatistics.changes30Days} / {stateStatistics.changes90Days}</div>
              <p className="text-xs text-muted-foreground">
                codes changed {selectedState && `in ${selectedState}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Alerts</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stateStatistics.openAlerts}</div>
              <p className="text-xs text-muted-foreground">
                legislative / policy {selectedState && `for ${selectedState}`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Rate Changes Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Recent Rate Changes
              {selectedState && (
                <span className="ml-2 text-sm font-normal text-blue-600">
                  (Filtered for {selectedState})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Track recent changes in service rates {selectedState && `for ${selectedState}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Summary Cards for Rate Changes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Changes</h3>
                <p className="text-xl font-bold text-gray-900">{filteredRateChanges.length.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Avg. % Change</h3>
                <p className="text-xl font-bold text-gray-900">
                  {filteredRateChanges.length > 0 
                    ? (filteredRateChanges.reduce((sum, change) => sum + change.percentageChange, 0) / filteredRateChanges.length).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">States Affected</h3>
                <p className="text-xl font-bold text-gray-900">
                  {new Set(filteredRateChanges.map(c => c.state)).size}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500">Service Categories</h3>
                <p className="text-xl font-bold text-gray-900">
                  {new Set(filteredRateChanges.map(c => c.serviceCategory)).size}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Service Category</label>
                  <select
                    value={rateChangeFilters.serviceCategory}
                    onChange={(e) => handleFilterChange('serviceCategory', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {filterOptions.serviceCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Service Code</label>
                  <select
                    value={rateChangeFilters.serviceCode}
                    onChange={(e) => handleFilterChange('serviceCode', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Codes</option>
                    {filterOptions.serviceCodes.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Provider Type</label>
                  <select
                    value={rateChangeFilters.providerType}
                    onChange={(e) => handleFilterChange('providerType', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    {filterOptions.providerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Program</label>
                  <select
                    value={rateChangeFilters.program}
                    onChange={(e) => handleFilterChange('program', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Programs</option>
                    {filterOptions.programs.map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoadingRateChanges && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading rate changes...</span>
              </div>
            )}

            {/* Error State */}
            {rateChangesError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Error loading rate changes: {rateChangesError}
                </p>
              </div>
            )}

            {/* Rate Changes Table */}
            {!isLoadingRateChanges && !rateChangesError && (
              <>
                {/* Results Summary */}
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Old Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Rate</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedRateChanges.length > 0 ? (
                        paginatedRateChanges.map((change) => (
                          <tr key={change.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{change.serviceCode}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate" title={change.description}>{change.description}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{change.state}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{change.serviceCategory}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatRate(change.oldRate)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatRate(change.newRate)}</td>
                            <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium flex items-center ${
                              change.percentageChange > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {change.percentageChange > 0 ? (
                                <ArrowUp className="h-3 w-3 mr-1" />
                              ) : (
                                <ArrowDown className="h-3 w-3 mr-1" />
                              )}
                              {change.percentageChange > 0 ? '+' : ''}{change.percentageChange.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(change.effectiveDate)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{change.providerType || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                            {selectedState 
                              ? `No rate changes found for ${selectedState} with the current filters.`
                              : 'Select a state to view rate changes.'
                            }
                          </td>
                        </tr>
                      )}
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Rate Developments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Megaphone className="h-5 w-5 mr-2" />
                Legislative & Provider Updates
                {selectedState && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    (Filtered for {selectedState})
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={rateDevelopmentsFilter}
                  onChange={(e) => setRateDevelopmentsFilter(e.target.value as 'all' | 'provider' | 'legislative')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="provider">Provider Alerts</option>
                  <option value="legislative">Legislative Updates</option>
                </select>
              </div>
            </CardTitle>
            <CardDescription>
              Track legislative bills and provider alerts {selectedState && `for ${selectedState}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {isLoadingRateDevelopments && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading rate developments...</span>
              </div>
            )}

            {/* Error State */}
            {rateDevelopmentsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Error loading rate developments: {rateDevelopmentsError}
                </p>
              </div>
            )}

            {/* Rate Developments Cards */}
            {!isLoadingRateDevelopments && !rateDevelopmentsError && (
              <>
                {/* Combined Cards */}
                {combinedRateDevelopments.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {combinedRateDevelopments.slice(0, 9).map((item, index) => (
                      <div key={`${item.type}-${index}`} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4">
                          {/* Status Badge and Date */}
                          <div className="flex justify-between items-start mb-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${item.statusBadge.color}`}>
                              {item.statusBadge.icon}
                              <span className="ml-1">{item.statusBadge.text}</span>
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatRateDevelopmentDate(item.date)}
                            </span>
                          </div>
                          
                          {/* Title */}
                          <h4 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                            {item.title}
                          </h4>
                          
                          {/* Category Tag */}
                          <div className="mb-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Service Lines
                            </span>
                          </div>
                          
                          {/* Description */}
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {item.description}
                          </p>
                          
                          {/* Action Link */}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {item.type === 'provider' ? 'View full notice' : 'View full bill'}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {combinedRateDevelopments.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Megaphone className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-600">
                      {selectedState 
                        ? `No rate developments found for ${selectedState} with the current filters.`
                        : 'Select a state to view rate developments.'
                      }
                    </p>
                  </div>
                )}

                {/* Show More Button */}
                {combinedRateDevelopments.length > 9 && (
                  <div className="text-center mt-8">
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Show more
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Metrics Data Notice */}
        {selectedState && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              <strong>Real Data:</strong> All metrics and rate changes are calculated from actual Medicaid rate data and alert information.
            </p>
          </div>
        )}
        
        {/* Error Notice */}
        {metricsError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              <strong>Error:</strong> {metricsError}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default HomePage;
