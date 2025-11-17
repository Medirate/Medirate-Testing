"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import Select from "react-select";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import clsx from "clsx";

interface FilterOptionsData {
  combinations: Combination[];
}

interface Combination {
  [key: string]: string;
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
  provider_type?: string;
  state_code?: string;
  [key: string]: string | undefined;
}

interface SelectionModalData {
  rowCount: number;
  rowsRemaining: number;
  rowsUsed: number;
  rowsLimit: number;
  selectedColumns: ColumnKey[];
}

interface ColumnOption {
  key: ColumnKey;
  label: string;
  description: string;
  formatter?: (row: ServiceData) => string;
}

type ColumnKey =
  | "state_name"
  | "state_code"
  | "service_category"
  | "service_code"
  | "service_description"
  | "rate"
  | "rate_per_hour"
  | "duration_unit"
  | "rate_effective_date"
  | "program"
  | "location_region"
  | "provider_type"
  | "modifier_1"
  | "modifier_1_details"
  | "modifier_2"
  | "modifier_2_details"
  | "modifier_3"
  | "modifier_3_details"
  | "modifier_4"
  | "modifier_4_details";

const COLUMN_OPTIONS: ColumnOption[] = [
  { key: "state_name", label: "State", description: "Full state name" },
  { key: "state_code", label: "State (Abbreviation)", description: "Two letter code" },
  { key: "service_category", label: "Service Category", description: "Primary service line" },
  { key: "service_code", label: "Service Code", description: "HCPCS/CPT or state code" },
  { key: "service_description", label: "Service Description", description: "Plain language description" },
  { key: "rate", label: "Rate per Base Unit", description: "Latest rate", formatter: (row) => formatRate(row.rate) },
  { key: "rate_per_hour", label: "Rate per Hour", description: "Calculated hourly rate" },
  { key: "duration_unit", label: "Duration Unit", description: "Unit of measure" },
  { key: "rate_effective_date", label: "Effective Date", description: "Rate effective date", formatter: (row) => formatDate(row.rate_effective_date) },
  { key: "program", label: "Program", description: "Waiver or program name" },
  { key: "location_region", label: "Location / Region", description: "County or metro" },
  { key: "provider_type", label: "Provider Type", description: "Provider category" },
  { key: "modifier_1", label: "Modifier 1", description: "Modifier code" },
  { key: "modifier_1_details", label: "Modifier 1 Details", description: "Modifier description" },
  { key: "modifier_2", label: "Modifier 2", description: "Modifier code" },
  { key: "modifier_2_details", label: "Modifier 2 Details", description: "Modifier description" },
  { key: "modifier_3", label: "Modifier 3", description: "Modifier code" },
  { key: "modifier_3_details", label: "Modifier 3 Details", description: "Modifier description" },
  { key: "modifier_4", label: "Modifier 4", description: "Modifier code" },
  { key: "modifier_4_details", label: "Modifier 4 Details", description: "Modifier description" },
];

const COLUMN_MAP = COLUMN_OPTIONS.reduce((acc, option) => {
  acc[option.key] = option;
  return acc;
}, {} as Record<ColumnKey, ColumnOption>);

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

interface Selections {
  state_name: string | null;
  service_category: string | null;
  service_code: string | null;
  service_description: string | null;
  program: string | null;
  location_region: string | null;
  provider_type: string | null;
  duration_unit: string | null;
  modifier_1: string | null;
  fee_schedule_date: string | null;
}

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
  const [startDate, setStartDate] = useState<Date | null>(new Date("2017-01-01"));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [selectedColumns, setSelectedColumns] = useState<ColumnKey[]>(COLUMN_OPTIONS.map((option) => option.key));
  const [exportUsage, setExportUsage] = useState<UsageResponse | null>(null);
  const [isPreparingExport, setIsPreparingExport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [limitModalRows, setLimitModalRows] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectionReview, setSelectionReview] = useState<SelectionModalData | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/filter-options");
        if (response.ok) {
          const data = await response.json();
          setFilterOptionsData(data);
        }
      } catch (error) {
        console.error("Failed to load filter options", error);
      }
    })();
  }, []);

  useEffect(() => {
    checkExportUsage();
  }, []);

  const columnSelectionCount = selectedColumns.length;
  const allColumnsSelected = columnSelectionCount === COLUMN_OPTIONS.length;

  const columnGroups = useMemo(() => {
    const midpoint = Math.ceil(COLUMN_OPTIONS.length / 2);
    return [COLUMN_OPTIONS.slice(0, midpoint), COLUMN_OPTIONS.slice(midpoint)];
  }, []);

  const buildFilters = () => {
    const filters: Record<string, string> = {};
    Object.entries(selections).forEach(([key, value]) => {
      if (value) filters[key] = value;
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

  const handleToggleColumn = (key: ColumnKey) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((col) => col !== key) : [...prev, key]
    );
  };

  const handleToggleAllColumns = () => {
    setSelectedColumns(allColumnsSelected ? [] : COLUMN_OPTIONS.map((option) => option.key));
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
      const csvContent = buildCsv(allData, selectionReview.selectedColumns);
      downloadCsv(csvContent);
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

  const buildCsv = (rows: ServiceData[], columns: ColumnKey[]) => {
    const watermarkHeader = [
      "MEDIRATE - PROPRIETARY DATA",
      `Copyright © ${new Date().getFullYear()} MediRate. All Rights Reserved.`,
      "This file contains proprietary and confidential information.",
      "Unauthorized copying, distribution, or modification is prohibited.",
      "",
      `Export generated on ${new Date().toLocaleString()}`,
      `Filters applied: ${buildFiltersSummary()}`,
      "",
    ];

    const headerRow = columns.map((column) => escapeCSV(COLUMN_MAP[column].label));
    const csvRows = [...watermarkHeader, headerRow.join(",")];

    rows.forEach((row) => {
      const values = columns.map((column) => {
        const option = COLUMN_MAP[column];
        const rawValue = option.formatter ? option.formatter(row) : (row[column] ?? "");
        return escapeCSV(rawValue);
      });
      csvRows.push(values.join(","));
    });

    csvRows.push("", "Generated by MediRate");
    return csvRows.join("\n");
  };

  const downloadCsv = (content: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const link = document.createElement("a");
    link.href = url;
    link.download = `medirate-export-${timestamp}.csv`;
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
        `Date Range: ${startDate ? formatDate(startDate.toISOString()) : "--"} - ${
          endDate ? formatDate(endDate.toISOString()) : "--"
        }`
      );
    }
    return activeFilters.length > 0 ? activeFilters.join(" | ") : "None";
  };

  const getAvailableOptions = (filterKey: keyof Selections) => {
    if (!filterOptionsData || !filterOptionsData.combinations) return [];
    const values = new Set<string>();
    filterOptionsData.combinations.forEach((combo) => {
      const value = combo[filterKey];
      if (value) values.add(value);
    });
    return Array.from(values)
      .sort()
      .map((value) => ({ value, label: value }));
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#012C61]/30 border-t-[#012C61]" />
      </div>
    );
  }

  return (
    <AppLayout activeTab="dataExport">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#5c759c]">Export Center</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#012C61]">Data Export</h1>
            <p className="text-sm text-slate-500">Select the exact columns and filters you need, then download a personalized CSV.</p>
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
              {FILTER_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {field.label}
                  </label>
                  <Select
                    className="mt-1 text-sm"
                    classNamePrefix="filter"
                    options={getAvailableOptions(field.key)}
                    isClearable
                    placeholder={field.placeholder}
                    value={
                      selections[field.key]
                        ? { value: selections[field.key]!, label: selections[field.key]! }
                        : null
                    }
                    onChange={(option) =>
                      setSelections((prev) => ({ ...prev, [field.key]: option?.value || null }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>
                <div className="mt-2 rounded-xl border border-slate-200 p-2">
                  <DayPicker
                    mode="single"
                    selected={startDate ?? undefined}
                    onSelect={(date) => setStartDate(date ?? null)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </label>
                <div className="mt-2 rounded-xl border border-slate-200 p-2">
                  <DayPicker
                    mode="single"
                    selected={endDate ?? undefined}
                    onSelect={(date) => setEndDate(date ?? null)}
                  />
                </div>
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
              <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
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
                Choose exactly which columns should appear in your CSV.
              </p>
            </div>
            <p className="text-sm font-medium text-[#012C61]">
              {columnSelectionCount} / {COLUMN_OPTIONS.length} selected
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
            Download CSV
          </button>
          <p className="text-xs text-slate-500">
            CSVs include watermark and usage tracking. You can regenerate the same export as many times as you like.
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
                  {COLUMN_MAP[column].label}
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

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
}

function formatRate(value?: string) {
  if (!value) return "";
  const amount = Number(value.toString().replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(amount)) return value;
  return `$${amount.toFixed(2)}`;
}

function escapeCSV(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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
