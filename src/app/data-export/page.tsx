"use client";

import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import ExcelJS from 'exceljs';
import Select from 'react-select';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import clsx from 'clsx';
import { gunzipSync, strFromU8 } from "fflate";

// Types
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
  provider_type?: string;
  state_code?: string;
  [key: string]: string | undefined;
}

// State abbreviations mapping
const STATE_ABBREVIATIONS: Record<string, string> = {
  "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
  "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
  "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
  "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
  "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
  "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS",
  "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV",
  "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
  "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK",
  "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT",
  "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA", "WEST VIRGINIA": "WV",
  "WISCONSIN": "WI", "WYOMING": "WY", "DISTRICT OF COLUMBIA": "DC"
};

const SERVICE_CATEGORY_ABBREVIATIONS: Record<string, string> = {
  "APPLIED BEHAVIOR ANALYSIS": "ABA",
  "APPLIED BEHAVIORAL ANALYSIS (ABA)": "ABA",
  "BEHAVIORAL HEALTH": "BH",
  "INTELLECTUAL AND DEVELOPMENTAL DISABILITIES": "IDD",
  "HOME AND COMMUNITY-BASED SERVICES": "HCBS"
};

export default function DataExport() {
  const auth = useProtectedPage();
  const router = useRouter();

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
  const [isExporting, setIsExporting] = useState(false);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
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
  const [pendingCsvExport, setPendingCsvExport] = useState<{ 
    rowCount: number; 
    proceed: () => void; 
    primaryUserEmail?: string; 
    userRole?: 'subscription_manager' | 'primary_user' | 'sub_user' 
  } | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const response = await fetch('/api/filter-options');
        if (response.ok) {
          const data = await response.json();
          setFilterOptionsData(data);
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };
    loadFilterOptions();
  }, []);

  // Check export usage on mount
  useEffect(() => {
    checkExportUsage();
  }, []);

  // Helper functions
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    let year: number, month: number, day: number;
    
    if (dateString.includes('/')) {
      const [monthStr, dayStr, yearStr] = dateString.split('/');
      month = parseInt(monthStr, 10);
      day = parseInt(dayStr, 10);
      year = parseInt(yearStr, 10);
    } else if (dateString.includes('-')) {
      const [yearStr, monthStr, dayStr] = dateString.split('-');
      year = parseInt(yearStr, 10);
      month = parseInt(monthStr, 10);
      day = parseInt(dayStr, 10);
    } else {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    }
    
    if (isNaN(year) || isNaN(month) || isNaN(day) || 
        month < 1 || month > 12 || day < 1 || day > 31) {
      return dateString;
    }
    
    return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
  };

  const formatRate = (rate: string | undefined) => {
    if (!rate) return '-';
    const numericRate = parseFloat(rate.replace(/[^0-9.-]/g, ''));
    if (isNaN(numericRate)) return rate;
    return `$${numericRate.toFixed(2)}`;
  };

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

  const getTotalCount = async (): Promise<number> => {
    const filters: Record<string, string> = {};
    for (const [key, value] of Object.entries(selections)) {
      if (value) filters[key] = value;
    }
    if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
    if (endDate) filters.end_date = endDate.toISOString().split('T')[0];

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
    return countResult.totalCount || 0;
  };

  // Export to Excel
  const handleExportExcel = async () => {
    setIsPreparingExport(true);
    
    try {
      const totalRowCount = await getTotalCount();
      
      if (totalRowCount === 0) {
        alert('No data available to export. Please adjust your filters.');
        setIsPreparingExport(false);
        return;
      }

      const usage = await checkExportUsage();
      if (!usage) {
        alert('Failed to check export limits. Please try again.');
        setIsPreparingExport(false);
        return;
      }

      if (totalRowCount > usage.rowsRemaining) {
        setPendingExportRowCount(totalRowCount);
        setShowUsageModal(true);
        setIsPreparingExport(false);
        return;
      }

      // Proceed with export
      await performExcelExport(totalRowCount);
      setIsPreparingExport(false);
    } catch (err) {
      console.error('Error preparing export:', err);
      alert(`Failed to prepare export: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsPreparingExport(false);
    }
  };

  const performExcelExport = async (expectedRowCount: number) => {
    setIsExporting(true);
    
    try {
      // Reserve rows
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

      // Update usage
      setExportUsage({
        rowsUsed: reserveData.rowsUsed,
        rowsLimit: reserveData.rowsLimit,
        rowsRemaining: reserveData.rowsRemaining,
        currentPeriodStart: reserveData.currentPeriodStart || '',
        currentPeriodEnd: reserveData.currentPeriodEnd || '',
        canExport: true,
      });

      // Build filters
      const filters: Record<string, string> = {};
      for (const [key, value] of Object.entries(selections)) {
        if (value) filters[key] = value;
      }
      if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
      if (endDate) filters.end_date = endDate.toISOString().split('T')[0];

      // Fetch all data
      const allData: ServiceData[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const exportPageSize = 1000;

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
          
          if (allData.length >= (result.totalCount || 0) || result.data.length < exportPageSize) {
            hasMore = false;
          } else {
            currentPageNum++;
          }
        } else {
          hasMore = false;
        }
      }

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'MediRate';
      workbook.created = new Date();

      // Notice sheet
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

      // Data sheet
      const dataSheet = workbook.addWorksheet('Data');
      dataSheet.columns = [
        { header: 'State', key: 'state', width: 10 },
        { header: 'Service Category', key: 'serviceCategory', width: 20 },
        { header: 'Service Code', key: 'serviceCode', width: 15 },
        { header: 'Service Description', key: 'serviceDescription', width: 40 },
        { header: 'Rate per Base Unit', key: 'rate', width: 18 },
        { header: 'Duration Unit', key: 'durationUnit', width: 15 },
        { header: 'Effective Date', key: 'effectiveDate', width: 15 },
        { header: 'Provider Type', key: 'providerType', width: 20 },
        { header: 'Modifier 1', key: 'modifier1', width: 20 },
        { header: 'Modifier 2', key: 'modifier2', width: 20 },
        { header: 'Modifier 3', key: 'modifier3', width: 20 },
        { header: 'Modifier 4', key: 'modifier4', width: 20 },
        { header: 'Program', key: 'program', width: 30 },
        { header: 'Location/Region', key: 'locationRegion', width: 25 },
      ];

      dataSheet.getRow(1).font = { bold: true };
      dataSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };

      allData.forEach(item => {
        const row = dataSheet.addRow({
          state: item.state_code || STATE_ABBREVIATIONS[item.state_name?.toUpperCase() || ""] || item.state_name || '',
          serviceCategory: SERVICE_CATEGORY_ABBREVIATIONS[item.service_category?.toUpperCase() || ""] || item.service_category || '',
          serviceCode: item.service_code || '',
          serviceDescription: item.service_description || '',
          rate: formatRate(item.rate) === '-' ? '' : formatRate(item.rate),
          durationUnit: item.duration_unit || '',
          effectiveDate: formatDate(item.rate_effective_date) === '-' ? '' : formatDate(item.rate_effective_date),
          providerType: item.provider_type || '',
          modifier1: item.modifier_1 ? (item.modifier_1_details ? `${item.modifier_1} - ${item.modifier_1_details}` : item.modifier_1) : '',
          modifier2: item.modifier_2 ? (item.modifier_2_details ? `${item.modifier_2} - ${item.modifier_2_details}` : item.modifier_2) : '',
          modifier3: item.modifier_3 ? (item.modifier_3_details ? `${item.modifier_3} - ${item.modifier_3_details}` : item.modifier_3) : '',
          modifier4: item.modifier_4 ? (item.modifier_4_details ? `${item.modifier_4} - ${item.modifier_4_details}` : item.modifier_4) : '',
          program: item.program || '',
          locationRegion: item.location_region || ''
        });

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.protection = { locked: true };
        });
      });

      // Protect sheet
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

      // Download
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `MediRate-export-${timestamp}.xlsx`;
      
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
      
      alert(`✅ Export successful!\n\n${allData.length.toLocaleString()} rows exported.\n${reserveData.rowsRemaining.toLocaleString()} rows remaining in your subscription.`);
      
      setIsExporting(false);
      await checkExportUsage(); // Refresh usage
    } catch (err) {
      console.error('❌ Excel export error:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsExporting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = async () => {
    setIsPreparingExport(true);

    try {
      const totalRowCount = await getTotalCount();
      
      if (totalRowCount === 0) {
        alert('No data available to export. Please adjust your filters.');
        setIsPreparingExport(false);
        return;
      }

      const [usage, primaryUserInfo] = await Promise.all([
        checkExportUsage(),
        getPrimaryUserInfo()
      ]);

      if (!usage) {
        alert('Failed to check export limits. Please try again.');
        setIsPreparingExport(false);
        return;
      }

      if (totalRowCount > usage.rowsRemaining) {
        setPendingExportRowCount(totalRowCount);
        setShowUsageModal(true);
        setIsPreparingExport(false);
        return;
      }

      setPendingCsvExport({
        rowCount: totalRowCount,
        proceed: () => performCsvExport(),
        primaryUserEmail: primaryUserInfo.primaryUserEmail || undefined,
        userRole: primaryUserInfo.userRole
      });
      setShowCsvWarningModal(true);
      setIsPreparingExport(false);
    } catch (err) {
      console.error('Error preparing export:', err);
      alert(`Failed to prepare export: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsPreparingExport(false);
    }
  };

  const performCsvExport = async () => {
    setIsExporting(true);
    setShowCsvWarningModal(false);
    
    try {
      const totalRowCount = await getTotalCount();
      
      // Reserve rows
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

      // Update usage
      setExportUsage({
        rowsUsed: reserveData.rowsUsed,
        rowsLimit: reserveData.rowsLimit,
        rowsRemaining: reserveData.rowsRemaining,
        currentPeriodStart: reserveData.currentPeriodStart || '',
        currentPeriodEnd: reserveData.currentPeriodEnd || '',
        canExport: true,
      });

      // Build filters
      const filters: Record<string, string> = {};
      for (const [key, value] of Object.entries(selections)) {
        if (value) filters[key] = value;
      }
      if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
      if (endDate) filters.end_date = endDate.toISOString().split('T')[0];

      // Fetch all data
      const allData: ServiceData[] = [];
      let currentPageNum = 1;
      let hasMore = true;
      const exportPageSize = 1000;

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
          
          if (allData.length >= (result.totalCount || 0) || result.data.length < exportPageSize) {
            hasMore = false;
          } else {
            currentPageNum++;
          }
        } else {
          hasMore = false;
        }
      }

      // Convert to CSV
      const headers = [
        'State',
        'Service Category',
        'Service Code',
        'Service Description',
        'Rate per Base Unit',
        'Duration Unit',
        'Effective Date',
        'Provider Type',
        'Modifier 1',
        'Modifier 2',
        'Modifier 3',
        'Modifier 4',
        'Program',
        'Location/Region'
      ];

      const escapeCSV = (value: string | null | undefined): string => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const formatRateForExport = (rate: string | undefined): string => {
        if (!rate) return '';
        const formatted = formatRate(rate);
        return formatted === '-' ? '' : formatted;
      };

      const formatDateForExport = (date: string | undefined): string => {
        if (!date) return '';
        const formatted = formatDate(date);
        return formatted === '-' ? '' : formatted;
      };

      const formatModifierForExport = (modifier: string | undefined, details: string | undefined): string => {
        if (!modifier) return '';
        return details ? `${modifier} - ${details}` : modifier;
      };

      const watermarkHeader = [
        'MEDIRATE - PROPRIETARY DATA',
        'Copyright © ' + new Date().getFullYear() + ' MediRate. All Rights Reserved.',
        'This file contains proprietary and confidential information.',
        'Unauthorized copying, distribution, or modification is prohibited.',
        '',
        `Export Date: ${new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`,
        `Total Records: ${allData.length}`,
        '',
      ];
      
      const csvRows = [
        ...watermarkHeader.map(row => escapeCSV(row)),
        headers.join(',')
      ];

      for (const item of allData) {
        const row = [
          escapeCSV(item.state_code || STATE_ABBREVIATIONS[item.state_name?.toUpperCase() || ""] || item.state_name || ''),
          escapeCSV(SERVICE_CATEGORY_ABBREVIATIONS[item.service_category?.toUpperCase() || ""] || item.service_category || ''),
          escapeCSV(item.service_code || ''),
          escapeCSV(item.service_description || ''),
          escapeCSV(formatRateForExport(item.rate)),
          escapeCSV(item.duration_unit || ''),
          escapeCSV(formatDateForExport(item.rate_effective_date)),
          escapeCSV(item.provider_type || ''),
          escapeCSV(formatModifierForExport(item.modifier_1, item.modifier_1_details)),
          escapeCSV(formatModifierForExport(item.modifier_2, item.modifier_2_details)),
          escapeCSV(formatModifierForExport(item.modifier_3, item.modifier_3_details)),
          escapeCSV(formatModifierForExport(item.modifier_4, item.modifier_4_details)),
          escapeCSV(item.program || ''),
          escapeCSV(item.location_region || '')
        ];
        csvRows.push(row.join(','));
      }

      const watermarkFooter = [
        '',
        'MEDIRATE - PROPRIETARY DATA',
        'Copyright © ' + new Date().getFullYear() + ' MediRate. All Rights Reserved.',
        'Generated by MediRate Dashboard'
      ];
      
      const csvRowsWithFooter = [
        ...csvRows,
        ...watermarkFooter.map(row => escapeCSV(row))
      ];
      
      const csvContent = csvRowsWithFooter.join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `MediRate-export-${timestamp}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      const updatedRemaining = reserveData.rowsRemaining;
      alert(`✅ Export successful!\n\n${allData.length.toLocaleString()} rows exported.\n${updatedRemaining.toLocaleString()} rows remaining in your subscription.`);
      
      setIsExporting(false);
      await checkExportUsage(); // Refresh usage
    } catch (err) {
      console.error('❌ Export error:', err);
      alert(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsExporting(false);
    }
  };

  // Get available options for filters (simplified version)
  const getAvailableOptions = (filterKey: keyof Selections) => {
    if (!filterOptionsData || !filterOptionsData.combinations) return [];
    
    const usedValues = new Set<string>();
    filterOptionsData.combinations.forEach(combo => {
      const value = combo[filterKey];
      if (value) usedValues.add(value);
    });
    
    return Array.from(usedValues).sort().map(value => ({
      value,
      label: value
    }));
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-solid"></div>
      </div>
    );
  }

  return (
    <AppLayout activeTab="dataExport">
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <h1 className="text-3xl font-bold text-[#012C61] mb-6">Data Export</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Export Usage</h2>
          {exportUsage ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Rows Used:</span>
                <span className="font-semibold">{exportUsage.rowsUsed.toLocaleString()} / {exportUsage.rowsLimit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rows Remaining:</span>
                <span className="font-semibold text-green-600">{exportUsage.rowsRemaining.toLocaleString()}</span>
              </div>
              {exportUsage.currentPeriodEnd && (
                <div className="text-sm text-gray-500 mt-2">
                  Resets on {new Date(exportUsage.currentPeriodEnd).toLocaleDateString('en-US', { 
                    month: '2-digit', 
                    day: '2-digit', 
                    year: 'numeric' 
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">Loading usage information...</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Filter Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Category</label>
              <Select
                options={getAvailableOptions('service_category')}
                value={selections.service_category ? { value: selections.service_category, label: selections.service_category } : null}
                onChange={(option) => setSelections(prev => ({ ...prev, service_category: option?.value || null }))}
                isClearable
                placeholder="Select Service Category"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <Select
                options={getAvailableOptions('state_name')}
                value={selections.state_name ? { value: selections.state_name, label: selections.state_name } : null}
                onChange={(option) => setSelections(prev => ({ ...prev, state_name: option?.value || null }))}
                isClearable
                placeholder="Select State"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Code</label>
              <Select
                options={getAvailableOptions('service_code')}
                value={selections.service_code ? { value: selections.service_code, label: selections.service_code } : null}
                onChange={(option) => setSelections(prev => ({ ...prev, service_code: option?.value || null }))}
                isClearable
                placeholder="Select Service Code"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Service Description</label>
              <Select
                options={getAvailableOptions('service_description')}
                value={selections.service_description ? { value: selections.service_description, label: selections.service_description } : null}
                onChange={(option) => setSelections(prev => ({ ...prev, service_description: option?.value || null }))}
                isClearable
                placeholder="Select Service Description"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <DayPicker
                mode="single"
                selected={startDate || undefined}
                onSelect={(date) => setStartDate(date || null)}
                className="border rounded-lg p-2"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <DayPicker
                mode="single"
                selected={endDate || undefined}
                onSelect={(date) => setEndDate(date || null)}
                className="border rounded-lg p-2"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Export Data</h2>
          
          <div className="flex gap-4">
            <button
              onClick={handleExportExcel}
              disabled={isExporting || isPreparingExport}
              className={clsx(
                "px-6 py-3 rounded-md font-medium transition-all",
                isExporting || isPreparingExport
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              )}
            >
              {isExporting || isPreparingExport ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isPreparingExport ? 'Preparing...' : 'Exporting...'}
                </span>
              ) : (
                'Export to Excel'
              )}
            </button>
            
            <button
              onClick={handleExportCSV}
              disabled={isExporting || isPreparingExport}
              className={clsx(
                "px-6 py-3 rounded-md font-medium transition-all",
                isExporting || isPreparingExport
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              )}
            >
              {isExporting || isPreparingExport ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isPreparingExport ? 'Preparing...' : 'Exporting...'}
                </span>
              ) : (
                'Export to CSV'
              )}
            </button>
          </div>
        </div>

        {/* Usage Limit Exceeded Modal */}
        {showUsageModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-xl font-semibold mb-4">Export Limit Exceeded</h3>
              <p className="text-gray-700 mb-4">
                You are trying to export <strong>{pendingExportRowCount.toLocaleString()} rows</strong>, but you only have <strong>{exportUsage?.rowsRemaining.toLocaleString() || 0} rows</strong> remaining in your subscription.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowUsageModal(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CSV Export Warning Modal */}
        {showCsvWarningModal && pendingCsvExport && exportUsage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg mx-4 shadow-xl">
              <h3 className="text-xl font-semibold mb-4">Export Confirmation</h3>
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">Export Details</p>
                  <p className="text-sm text-gray-700">
                    File will contain: <strong>{pendingCsvExport.rowCount.toLocaleString()} rows</strong>
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Subscription Usage</p>
                  <div className="text-sm text-gray-700 space-y-1">
                    <div className="flex justify-between">
                      <span>Rows remaining:</span>
                      <span className="font-semibold">{exportUsage.rowsRemaining.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rows used:</span>
                      <span>{exportUsage.rowsUsed.toLocaleString()} / {exportUsage.rowsLimit.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCsvWarningModal(false);
                    setPendingCsvExport(null);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (pendingCsvExport) {
                      pendingCsvExport.proceed();
                    }
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Confirm Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

