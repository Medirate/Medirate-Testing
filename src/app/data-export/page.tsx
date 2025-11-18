"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import Select from "react-select";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import clsx from "clsx";
import { gunzipSync, strFromU8 } from "fflate";
import { Calendar } from "lucide-react";
import ExcelJS from "exceljs";
import { fixEncoding } from "@/lib/encoding-fix";
import DataExportTemplatesIcon, { DataExportTemplateData } from "@/app/components/DataExportTemplatesIcon";
import LoaderOverlay from "@/app/components/LoaderOverlay";

interface FilterOptionsData {
  filters: {
    [key: string]: string[];
  };
  combinations: Combination[];
}

interface Combination {
  [key: string]: string;
}

interface ServiceData {
  [key: string]: any; // All columns from database
}

interface ColumnOption {
  key: string;
  label: string;
  description: string;
  formatter?: (row: ServiceData) => string;
}

interface Selections {
  state_name: string | string[] | null;
  service_category: string | null; // Single select only
  service_code: string | string[] | null;
  service_description: string | string[] | null;
  program: string | string[] | null;
  location_region: string | string[] | null;
  provider_type: string | string[] | null;
  duration_unit: string | string[] | null;
  modifier_1: string | string[] | null;
  fee_schedule_date: string | null;
}

interface UsageResponse {
  rowsUsed: number;
  rowsLimit: number;
  rowsRemaining: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canExport?: boolean;
  message?: string;
}

interface SelectionModalData {
  rowCount: number;
  rowsRemaining: number;
  rowsUsed: number;
  rowsLimit: number;
  selectedColumns: string[];
}

// All columns from master_data_sept_2 table based on schema
const ALL_COLUMN_OPTIONS: ColumnOption[] = [
  { key: "id", label: "ID", description: "Unique record identifier" },
  { key: "new_field", label: "New Field", description: "Additional field" },
  { key: "service_category", label: "Service Category", description: "Primary service line" },
  { key: "service_sub_category", label: "Service Sub Category", description: "Sub-category classification" },
  { key: "state_id_pk", label: "State ID", description: "State identifier" },
  { key: "state_name", label: "State", description: "Full state name" },
  { key: "state_code", label: "State Code", description: "Two letter abbreviation" },
  { key: "filename", label: "Filename", description: "Source document filename" },
  { key: "page_number", label: "Page Number", description: "Page in source document" },
  { key: "service_id_pk", label: "Service ID", description: "Service identifier" },
  { key: "service_code", label: "Service Code", description: "HCPCS/CPT or state code" },
  { key: "service_description", label: "Service Description", description: "Plain language description" },
  { key: "rate", label: "Rate per Base Unit", description: "Latest rate", formatter: (row) => formatRate(row.rate) },
  { key: "rate_last_updated", label: "Rate Last Updated", description: "Last update timestamp" },
  { key: "rate_effective_date", label: "Effective Date", description: "Rate effective date", formatter: (row) => formatDate(row.rate_effective_date) },
  { key: "duration_unit", label: "Duration Unit", description: "Unit of measure" },
  { key: "minutes", label: "Minutes", description: "Duration in minutes" },
  { key: "program", label: "Program", description: "Waiver or program name" },
  { key: "modifier_1", label: "Modifier 1", description: "Modifier code" },
  { key: "modifier_1_details", label: "Modifier 1 Details", description: "Modifier description" },
  { key: "modifier_2", label: "Modifier 2", description: "Modifier code" },
  { key: "modifier_2_details", label: "Modifier 2 Details", description: "Modifier description" },
  { key: "modifier_3", label: "Modifier 3", description: "Modifier code" },
  { key: "modifier_3_details", label: "Modifier 3 Details", description: "Modifier description" },
  { key: "modifier_4", label: "Modifier 4", description: "Modifier code" },
  { key: "modifier_4_details", label: "Modifier 4 Details", description: "Modifier description" },
  { key: "fee", label: "Fee", description: "Fee amount" },
  { key: "max_fee", label: "Max Fee", description: "Maximum fee amount" },
  { key: "modifier_id_pk", label: "Modifier ID", description: "Modifier identifier" },
  { key: "service_id_fk", label: "Service Foreign Key", description: "Service reference" },
  { key: "prior_auth_required", label: "Prior Auth Required", description: "Prior authorization requirement" },
  { key: "comments", label: "Comments", description: "Additional comments" },
  { key: "location_region", label: "Location / Region", description: "County or metro" },
  { key: "update_id_pk", label: "Update ID", description: "Update identifier" },
  { key: "times_rate_updated", label: "Times Rate Updated", description: "Number of rate updates" },
  { key: "percentage_change", label: "Percentage Change", description: "Rate change percentage" },
  { key: "last_database_refresh", label: "Last Database Refresh", description: "Last refresh timestamp" },
  { key: "requires_pa", label: "Requires PA", description: "Prior authorization flag" },
  { key: "rate_per_hour", label: "Rate per Hour", description: "Calculated hourly rate" },
  { key: "provider_type", label: "Provider Type", description: "Provider category" },
  { key: "age", label: "Age", description: "Age requirement" },
  { key: "unnamed_40", label: "Unnamed 40", description: "Additional field 40" },
  { key: "unnamed_41", label: "Unnamed 41", description: "Additional field 41" },
  { key: "created_at", label: "Created At", description: "Record creation timestamp", formatter: (row) => formatDate(row.created_at) },
  { key: "updated_at", label: "Updated At", description: "Record update timestamp", formatter: (row) => formatDate(row.updated_at) },
];

const COLUMN_MAP = ALL_COLUMN_OPTIONS.reduce((acc, option) => {
  acc[option.key] = option;
  return acc;
}, {} as Record<string, ColumnOption>);

const FILTER_FIELDS: Array<{ key: keyof Selections; label: string; placeholder: string }> = [
  { key: "service_category", label: "Service Line", placeholder: "Select service line" },
  { key: "state_name", label: "State", placeholder: "Select state" },
  { key: "service_code", label: "Service Code", placeholder: "Select code" },
  { key: "service_description", label: "Service Description", placeholder: "Select description" },
  { key: "program", label: "Program", placeholder: "Select program" },
  { key: "location_region", label: "Location / Region", placeholder: "Select region" },
  { key: "provider_type", label: "Provider Type", placeholder: "Select provider type" },
  { key: "duration_unit", label: "Duration Unit", placeholder: "Select unit" },
  { key: "modifier_1", label: "Modifier 1", placeholder: "Select modifier" },
];

const buttonClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-transparent bg-[#012C61] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#001f44] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#001f44]";

export default function DataExport() {
  const { isLoading } = useProtectedPage();
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
    modifier_1: null,
    fee_schedule_date: null,
  });
  // Helper function to format date for input (DD/MM/YYYY)
  const formatDateInput = (date: Date | null): string => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [startDate, setStartDate] = useState<Date | null>(new Date("2017-01-01"));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [startDateInput, setStartDateInput] = useState<string>("01/01/2017");
  const [endDateInput, setEndDateInput] = useState<string>(formatDateInput(new Date()));
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(ALL_COLUMN_OPTIONS.map((option) => option.key));
  const [exportUsage, setExportUsage] = useState<UsageResponse | null>(null);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [limitModalRows, setLimitModalRows] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectionReview, setSelectionReview] = useState<SelectionModalData | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);

  // Load filter options from compressed file (same as dashboard)
  useEffect(() => {
    async function loadUltraFilterOptions() {
      try {
        setIsLoadingFilters(true);
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
                  combo[col] = intValue.map(dateInt => 
                    dateInt === -1 ? '' : mappings[col][String(dateInt)]
                  ).filter(date => date !== '');
                } else {
                  combo[col] = intValue === -1 ? '' : mappings[col][String(intValue)];
                }
              } else {
                combo[col] = intValue === -1 ? '' : mappings[col][String(intValue)];
              }
            });
            combinations.push(combo);
          }
          
          // Extract unique values for each filter
          const filters: Record<string, string[]> = {};
          columns.forEach((col: string) => {
            if (col !== 'rate_effective_date') {
              const uniqueValues = Array.from(new Set(
                combinations.map(c => c[col]).filter(Boolean)
              )).sort();
              filters[col] = uniqueValues;
            }
          });
          
          setFilterOptionsData({ filters, combinations });
        } else {
          // Fallback to old format
          setFilterOptionsData(data);
        }
      } catch (error) {
        console.error("Failed to load filter options", error);
      } finally {
        setIsLoadingFilters(false);
      }
    }
    loadUltraFilterOptions();
  }, []);

  useEffect(() => {
    checkExportUsage();
  }, []);

  // Parse manual date input (DD/MM/YYYY format)
  const parseDateInput = (input: string): Date | null => {
    const parts = input.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
    return date;
  };

  // Update date when input changes
  useEffect(() => {
    const parsed = parseDateInput(startDateInput);
    if (parsed) {
      setStartDate(parsed);
    }
  }, [startDateInput]);

  useEffect(() => {
    const parsed = parseDateInput(endDateInput);
    if (parsed) {
      setEndDate(parsed);
    }
  }, [endDateInput]);

  // Update input when calendar date changes
  useEffect(() => {
    if (startDate) {
      setStartDateInput(formatDateInput(startDate));
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      setEndDateInput(formatDateInput(endDate));
    }
  }, [endDate]);

  const columnSelectionCount = selectedColumns.length;
  const allColumnsSelected = columnSelectionCount === ALL_COLUMN_OPTIONS.length;

  const columnGroups = useMemo(() => {
    const midpoint = Math.ceil(ALL_COLUMN_OPTIONS.length / 2);
    return [ALL_COLUMN_OPTIONS.slice(0, midpoint), ALL_COLUMN_OPTIONS.slice(midpoint)];
  }, []);

  const buildFilters = () => {
    const filters: Record<string, string> = {};
    Object.entries(selections).forEach(([key, value]) => {
      if (value) {
        // Convert arrays to comma-separated strings for API
        if (Array.isArray(value)) {
          filters[key] = value.join(',');
        } else {
          filters[key] = value;
        }
      }
    });
    if (startDate) filters.start_date = startDate.toISOString().split("T")[0];
    if (endDate) filters.end_date = endDate.toISOString().split("T")[0];
    return filters;
  };

  const checkExportUsage = async () => {
    try {
      const response = await fetch("/api/excel-export/check-usage");
      if (response.ok) {
        const usage = (await response.json()) as UsageResponse;
        setExportUsage(usage);
        return usage;
      }
    } catch (error) {
      console.error("Failed to check export usage", error);
    }
    return null;
  };

  const getTotalRowCount = async () => {
    const filters = buildFilters();
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => params.append(key, value));
    params.append("page", "1");
    params.append("itemsPerPage", "1");
    const response = await fetch(`/api/state-payment-comparison?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch row count");
    }
    const result = await response.json();
    setTotalCount(result.totalCount || 0);
    return result.totalCount || 0;
  };

  const handleToggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };

  const handleToggleAllColumns = () => {
    setSelectedColumns(allColumnsSelected ? [] : ALL_COLUMN_OPTIONS.map((option) => option.key));
  };

  // Helper function to check if there are blank entries for a secondary filter
  const hasBlankEntriesForFilter = (filterKey: keyof Selections): boolean => {
    if (!filterOptionsData || !filterOptionsData.combinations) return false;
    
    // Build filter conditions based on current selections (same as getAvailableOptions)
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

  const getAvailableOptions = (filterKey: keyof Selections) => {
    if (!filterOptionsData || !filterOptionsData.combinations) return [];
    
    // Build filter conditions based on current selections
    const conditions: ((combo: Combination) => boolean)[] = [];
    
    Object.entries(selections).forEach(([key, value]) => {
      if (key !== filterKey && value) {
        conditions.push(combo => {
          if (key === 'fee_schedule_date') {
            if (Array.isArray(combo.rate_effective_date)) {
              return combo.rate_effective_date.includes(value);
            }
            return combo.rate_effective_date === value;
          }
          // Handle multi-select values (arrays) vs single values (strings)
          const comboValue = combo[key];
          if (Array.isArray(value)) {
            return value.includes(String(comboValue));
          } else {
            return comboValue === value;
          }
        });
      }
    });
    
    // Filter combinations
    const filteredCombinations = filterOptionsData.combinations.filter(combo => 
      conditions.every(condition => condition(combo))
    );
    
    // Extract unique values for this filter
    const values = new Set<string>();
    filteredCombinations.forEach((combo) => {
      const value = combo[filterKey];
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => values.add(v));
        } else {
          values.add(value);
        }
      }
    });
    
    // Build options array
    const options = Array.from(values)
      .sort()
      .map((value) => ({ value, label: value }));
    
    // For secondary filters, conditionally add "-" option if there are blank entries
    const secondaryFilters = ['program', 'location_region', 'provider_type', 'modifier_1'];
    if (secondaryFilters.includes(filterKey as string) && filterKey !== 'duration_unit') {
      const hasBlankEntries = hasBlankEntriesForFilter(filterKey);
      if (hasBlankEntries) {
        return [{ value: '-', label: '-' }, ...options];
      }
    }
    
    return options;
  };

  // Helper function to check if a filter should be disabled
  const isFilterDisabled = (filterKey: keyof Selections): boolean => {
    const availableOptions = getAvailableOptions(filterKey);
    
    // Service category is never disabled (it's the first filter)
    if (filterKey === 'service_category') {
      return false;
    }
    
    // State requires service category
    if (filterKey === 'state_name') {
      return !selections.service_category || availableOptions.length === 0;
    }
    
    // All other filters require both service_category and state_name
    // Check if state_name has any value (could be string or array)
    const hasStateSelection = selections.state_name && 
      (Array.isArray(selections.state_name) ? selections.state_name.length > 0 : true);
    
    if (!selections.service_category || !hasStateSelection) {
      return true;
    }
    
    // Check if there are any available options
    return availableOptions.length === 0;
  };

  const prepareExport = async () => {
    if (selectedColumns.length === 0) {
      alert("Please select at least one column before exporting.");
      return;
    }

    setIsPreparingExport(true);
    try {
      const [usage, totalRows] = await Promise.all([checkExportUsage(), getTotalRowCount()]);
      if (!usage) {
        throw new Error("Unable to verify subscription usage.");
      }

      if (totalRows === 0) {
        alert("No data available for the current selection. Please adjust your filters.");
        setIsPreparingExport(false);
        return;
      }

      if (totalRows > usage.rowsRemaining) {
        setLimitModalRows(totalRows);
        setShowLimitModal(true);
        setIsPreparingExport(false);
        return;
      }

      setSelectionReview({
        rowCount: totalRows,
        rowsRemaining: usage.rowsRemaining,
        rowsUsed: usage.rowsUsed,
        rowsLimit: usage.rowsLimit,
        selectedColumns,
      });
    } catch (error) {
      console.error("Failed to prepare export", error);
      alert(error instanceof Error ? error.message : "Unexpected error while preparing export.");
    } finally {
      setIsPreparingExport(false);
    }
  };

  const confirmExport = async () => {
    if (!selectionReview) return;
    setSelectionReview(null);
    setIsExporting(true);
    try {
      const filters = buildFilters();
      const reserveResponse = await fetch("/api/excel-export/check-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rowCount: selectionReview.rowCount }),
      });

      if (!reserveResponse.ok) {
        const errorData = await reserveResponse.json();
        throw new Error(errorData.message || "Unable to reserve rows for export.");
      }

      const reserveData = (await reserveResponse.json()) as UsageResponse & {
        rowsRemaining: number;
      };

      if (!reserveData.canExport) {
        throw new Error(reserveData.message || "Export limit reached. Please try again later.");
      }

      const allData = await fetchAllData(filters);
      await buildExcel(allData, selectionReview.selectedColumns);
      setExportUsage(reserveData);
      alert(
        `✅ Export ready!\n\nRows exported: ${selectionReview.rowCount.toLocaleString()}\nRows remaining this period: ${reserveData.rowsRemaining.toLocaleString()}`
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Export failed unexpectedly.");
    } finally {
      setIsExporting(false);
    }
  };

  const fetchAllData = async (filters: Record<string, string>) => {
    const pageSize = 1000;
    let page = 1;
    let hasMore = true;
    const rows: ServiceData[] = [];

    while (hasMore) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => params.append(key, value));
      params.append("page", String(page));
      params.append("itemsPerPage", String(pageSize));
      const response = await fetch(`/api/state-payment-comparison?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data for page ${page}.`);
      }
      const result = await response.json();
      const data = Array.isArray(result.data) ? result.data : [];
      rows.push(...data);
      page += 1;
      hasMore = rows.length < (result.totalCount || 0);
    }

    return rows;
  };

  const handleLoadTemplate = (templateData: DataExportTemplateData) => {
    if (templateData.selections) {
      setSelections({
        state_name: templateData.selections.state_name ?? null,
        service_category: templateData.selections.service_category ?? null,
        service_code: templateData.selections.service_code ?? null,
        service_description: templateData.selections.service_description ?? null,
        program: templateData.selections.program ?? null,
        location_region: templateData.selections.location_region ?? null,
        provider_type: templateData.selections.provider_type ?? null,
        duration_unit: templateData.selections.duration_unit ?? null,
        modifier_1: templateData.selections.modifier_1 ?? null,
        fee_schedule_date: templateData.selections.fee_schedule_date ?? null,
      });
    }

    const applyDate = (
      isoDate: string | null | undefined,
      setDate: (date: Date | null) => void,
      setInput: (value: string) => void
    ) => {
      if (isoDate) {
        const parsedDate = new Date(isoDate);
        if (!Number.isNaN(parsedDate.getTime())) {
          setDate(parsedDate);
          setInput(formatDateInput(parsedDate));
          return;
        }
      }
      setDate(null);
      setInput("");
    };

    applyDate(templateData.startDate, setStartDate, setStartDateInput);
    applyDate(templateData.endDate, setEndDate, setEndDateInput);

    if (Array.isArray(templateData.selectedColumns) && templateData.selectedColumns.length > 0) {
      const validColumns = templateData.selectedColumns.filter((col) => COLUMN_MAP[col]);
      if (validColumns.length > 0) {
        setSelectedColumns(validColumns);
      } else {
        setSelectedColumns(ALL_COLUMN_OPTIONS.map((option) => option.key));
      }
    } else {
      setSelectedColumns(ALL_COLUMN_OPTIONS.map((option) => option.key));
    }
  };

  const buildExcel = async (rows: ServiceData[], columns: string[]) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MediRate";
    workbook.created = new Date();

    // Create notice sheet
    const noticeSheet = workbook.addWorksheet("Notice");
    noticeSheet.getColumn(1).width = 60;
    noticeSheet.getRow(1).getCell(1).value = "MEDIRATE - PROPRIETARY DATA";
    noticeSheet.getRow(1).getCell(1).font = { bold: true, size: 14 };
    noticeSheet.getRow(2).getCell(1).value = `Copyright © ${new Date().getFullYear()} MediRate. All Rights Reserved.`;
    noticeSheet.getRow(3).getCell(1).value = "This file contains proprietary and confidential information.";
    noticeSheet.getRow(4).getCell(1).value = "Unauthorized copying, distribution, or modification is prohibited.";
    noticeSheet.getRow(6).getCell(1).value = `Export Date: ${new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
    noticeSheet.getRow(7).getCell(1).value = `Total Records: ${rows.length}`;
    noticeSheet.getRow(8).getCell(1).value = `Filters applied: ${buildFiltersSummary()}`;

    // Create main data sheet
    const dataSheet = workbook.addWorksheet("Data");

    // Define columns with proper headers
    const columnHeaders = columns.map((col) => ({
      header: COLUMN_MAP[col]?.label || col,
      key: col,
      width: Math.max(15, (COLUMN_MAP[col]?.label || col).length + 2),
    }));
    dataSheet.columns = columnHeaders;

    // Add header row with styling
    const headerRow = dataSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF012C61" },
    };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add data rows
    rows.forEach((row) => {
      const rowData: Record<string, any> = {};
      columns.forEach((column) => {
        const option = COLUMN_MAP[column];
        if (option?.formatter) {
          rowData[column] = fixEncoding(option.formatter(row));
        } else {
          const rawValue = row[column] ?? "";
          rowData[column] = fixEncoding(rawValue);
        }
      });
      dataSheet.addRow(rowData);
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.href = url;
    link.download = `medirate-export-${timestamp}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildFiltersSummary = () => {
    const activeFilters: string[] = [];
    Object.entries(selections).forEach(([key, value]) => {
      if (value) {
        activeFilters.push(`${formatLabel(key)}: ${value}`);
      }
    });
    if (startDate || endDate) {
      activeFilters.push(
        `Date Range: ${startDate ? formatDateInput(startDate) : "--"} - ${
          endDate ? formatDateInput(endDate) : "--"
        }`
      );
    }
    return activeFilters.length > 0 ? activeFilters.join(" | ") : "None";
  };

  if (isLoading) {
    return <LoaderOverlay />;
  }

  return (
    <AppLayout activeTab="dataExport">
      <DataExportTemplatesIcon
        onLoadTemplate={handleLoadTemplate}
        currentSelections={selections as unknown as Record<string, string | null>}
        currentStartDate={startDate}
        currentEndDate={endDate}
        currentSelectedColumns={selectedColumns}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#5c759c]">Export Center</p>
            <h1 className="mt-1 text-3xl font-lemonMilkRegular uppercase text-[#012C61]">Data Export</h1>
            <p className="text-sm text-slate-500">Select the exact columns and filters you need, then download a personalized Excel file.</p>
          </div>
          <button
            onClick={handleToggleAllColumns}
            className="rounded-full border border-[#012C61]/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#012C61] hover:bg-white"
          >
            {allColumnsSelected ? "Deselect All Columns" : "Select All Columns"}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-base font-semibold text-slate-900">Filters</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {FILTER_FIELDS.map((field) => {
                const isMultiFilter = field.key !== "service_category";
                const fieldValue = selections[field.key];
                const selectValue = isMultiFilter
                  ? Array.isArray(fieldValue)
                    ? fieldValue.map((val) => ({ value: val, label: val }))
                    : fieldValue
                    ? [{ value: fieldValue, label: fieldValue }]
                    : []
                  : fieldValue
                  ? { value: fieldValue, label: fieldValue }
                  : null;

                const isDisabled = isFilterDisabled(field.key);
                const availableOptions = getAvailableOptions(field.key);
                
                return (
                  <div key={field.key}>
                    <label className={clsx(
                      "text-xs font-semibold uppercase tracking-wide",
                      isDisabled ? "text-slate-300" : "text-slate-500"
                    )}>
                      {field.label}
                    </label>
                    <Select
                      className="mt-1 text-sm"
                      classNamePrefix="filter"
                      options={availableOptions}
                      isClearable
                      isMulti={isMultiFilter}
                      closeMenuOnSelect={!isMultiFilter}
                      hideSelectedOptions={!isMultiFilter}
                      placeholder={field.placeholder}
                      isLoading={isLoadingFilters}
                      isDisabled={isDisabled}
                      value={selectValue}
                      onChange={(option) => {
                        if (!isMultiFilter) {
                          const singleOption = option as { value: string; label: string } | null;
                          setSelections((prev) => ({
                            ...prev,
                            [field.key]: singleOption?.value || null,
                          }));
                        } else {
                          const selectedValues = Array.isArray(option)
                            ? option.map((opt) => opt.value)
                            : option
                            ? [option.value]
                            : [];
                          setSelections((prev) => ({
                            ...prev,
                            [field.key]: selectedValues.length > 0 ? selectedValues : null,
                          }));
                        }
                      }}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          backgroundColor: isDisabled ? '#e5e7eb' : 'white',
                          opacity: isDisabled ? 0.4 : 1,
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          borderColor: isDisabled ? '#d1d5db' : provided.borderColor,
                        }),
                        placeholder: (provided) => ({
                          ...provided,
                          color: isDisabled ? '#9ca3af' : '#6b7280',
                        }),
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={startDateInput}
                    onChange={(e) => setStartDateInput(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#012C61] focus:outline-none focus:ring-1 focus:ring-[#012C61]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStartCalendar(!showStartCalendar)}
                    className="flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
                    title="Open calendar"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
                {showStartCalendar && (
                  <div className="relative mt-2">
                    <div className="absolute z-10 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <DayPicker
                        mode="single"
                        selected={startDate ?? undefined}
                        onSelect={(date) => {
                          setStartDate(date ?? null);
                          setShowStartCalendar(false);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={endDateInput}
                    onChange={(e) => setEndDateInput(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#012C61] focus:outline-none focus:ring-1 focus:ring-[#012C61]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEndCalendar(!showEndCalendar)}
                    className="flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-slate-600 hover:bg-slate-50"
                    title="Open calendar"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
                {showEndCalendar && (
                  <div className="relative mt-2">
                    <div className="absolute z-10 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <DayPicker
                        mode="single"
                        selected={endDate ?? undefined}
                        onSelect={(date) => {
                          setEndDate(date ?? null);
                          setShowEndCalendar(false);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Usage</h2>
              <button
                onClick={checkExportUsage}
                className="text-xs font-semibold text-[#012C61] hover:text-[#001f44]"
              >
                Refresh
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">Each subscription includes 20,000 export rows per month.</p>
            {exportUsage ? (
              <div className="mt-4 space-y-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Usage</span>
                    <span className="font-semibold text-slate-900">
                      {Math.round((exportUsage.rowsUsed / exportUsage.rowsLimit) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min((exportUsage.rowsUsed / exportUsage.rowsLimit) * 100, 100)}%`,
                        backgroundColor:
                          (exportUsage.rowsUsed / exportUsage.rowsLimit) * 100 >= 90
                            ? "#ef4444" // red-500
                            : (exportUsage.rowsUsed / exportUsage.rowsLimit) * 100 >= 75
                            ? "#f59e0b" // amber-500
                            : "#10b981", // emerald-500
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Rows Used</span>
                  <span className="font-semibold text-slate-900">
                    {exportUsage.rowsUsed.toLocaleString()} / {exportUsage.rowsLimit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Rows Remaining</span>
                  <span className="font-semibold text-emerald-600">
                    {exportUsage.rowsRemaining.toLocaleString()}
                  </span>
                </div>
                {exportUsage.currentPeriodEnd && (
                  <p className="text-xs text-slate-500">
                    Resets on {new Date(exportUsage.currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Loading usage summary…</p>
            )}
            {typeof totalCount === "number" && (
              <p className="mt-4 rounded-lg bg-slate-100 p-2 text-xs text-slate-600">
                Current selection contains <strong>{totalCount.toLocaleString()}</strong> rows.
              </p>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Columns</h2>
              <p className="text-sm text-slate-500">
                Choose exactly which columns should appear in your Excel file.
              </p>
            </div>
            <p className="text-sm font-medium text-[#012C61]">
              {columnSelectionCount} / {ALL_COLUMN_OPTIONS.length} selected
            </p>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {columnGroups.map((group, index) => (
              <div key={index} className="space-y-3">
                {group.map((option) => (
                  <label
                    key={option.key}
                    className={clsx(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                      selectedColumns.includes(option.key)
                        ? "border-[#012C61]/40 bg-[#012C61]/5"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#012C61] focus:ring-[#012C61]"
                      checked={selectedColumns.includes(option.key)}
                      onChange={() => handleToggleColumn(option.key)}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={prepareExport}
            disabled={isPreparingExport || isExporting}
            className={clsx(buttonClasses, {
              "opacity-60": isPreparingExport || isExporting,
            })}
          >
            {(isPreparingExport || isExporting) && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            Download Excel
          </button>
          <p className="text-xs text-slate-500">
            Excel files include watermark and usage tracking. You can regenerate the same export as many times as you like.
          </p>
        </div>

        {showLimitModal && (
          <ModalShell onClose={() => setShowLimitModal(false)}>
            <h3 className="text-lg font-semibold text-slate-900">Export Limit Exceeded</h3>
            <p className="mt-3 text-sm text-slate-600">
              Your current filters return <strong>{limitModalRows.toLocaleString()} rows</strong>, but you only have
              <strong> {exportUsage?.rowsRemaining.toLocaleString() ?? 0} rows</strong> remaining this month.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Adjust your filters or wait until your usage resets.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Got it
              </button>
            </div>
          </ModalShell>
        )}

        {selectionReview && (
          <ModalShell onClose={() => setSelectionReview(null)}>
            <h3 className="text-lg font-semibold text-slate-900">Review Your Export</h3>
            <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                Rows to export: <strong>{selectionReview.rowCount.toLocaleString()}</strong>
              </p>
              <p>
                Rows remaining afterwards: <strong>{(selectionReview.rowsRemaining - selectionReview.rowCount).toLocaleString()}</strong>
              </p>
              <p>
                Columns selected: <strong>{selectionReview.selectedColumns.length}</strong>
              </p>
            </div>
            <div className="mt-4 max-h-40 space-y-1 overflow-auto rounded-xl border border-slate-100 p-3 text-xs text-slate-500">
              {selectionReview.selectedColumns.map((column) => (
                <span key={column} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {COLUMN_MAP[column]?.label || column}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Rows remaining this billing period: {selectionReview.rowsRemaining.toLocaleString()} of {selectionReview.rowsLimit.toLocaleString()}
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => setSelectionReview(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button onClick={confirmExport} className={buttonClasses}>
                Confirm & Download
              </button>
            </div>
          </ModalShell>
        )}
      </div>
    </AppLayout>
  );
}

function formatDate(dateString?: string | Date) {
  if (!dateString) return "";
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatRate(value?: string) {
  if (!value) return "";
  const amount = Number(value.toString().replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(amount)) return value;
  return `$${amount.toFixed(2)}`;
}

function formatLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex justify-end">
          <button
            className="text-slate-400 transition hover:text-slate-600"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
