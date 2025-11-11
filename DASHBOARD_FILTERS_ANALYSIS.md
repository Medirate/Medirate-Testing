# Dashboard Filters - Deep Analysis

## Overview

The dashboard uses a sophisticated **client-side filtering system** that dynamically updates available filter options based on user selections. The system ensures that only valid combinations of filters are available at each step.

## Core Architecture

### 1. **Data Structure**

#### Filter Options Data (`FilterOptionsData`)
```typescript
interface FilterOptionsData {
  filters: {
    [key: string]: string[];  // Available options for each filter
  };
  combinations: Combination[];  // All possible combinations of filter values
}

interface Combination {
  [key: string]: string;  // Represents one valid combination of filter values
}
```

#### Selections State
```typescript
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
```

### 2. **Filter Loading Process**

#### Initial Load (`loadUltraFilterOptions`)
1. **Fetches compressed filter data**: `/filter_options.json.gz`
2. **Parses the data** into:
   - `filters`: Available options for each filter type
   - `combinations`: All valid combinations of filter values
3. **Stores in state**: `setFilterOptionsData({ filters, combinations })`

#### Filter Options Update (`loadFilterOptions`)
- **Triggered**: When any selection changes (with 100ms debounce)
- **Process**:
  1. Builds filter conditions based on current selections
  2. Filters combinations to match all current selections
  3. Extracts unique values for each filter from filtered combinations
  4. Updates available options dynamically

### 3. **Filter Dependency Chain**

Filters have a **strict dependency order**:

```
1. service_category (Required - Step 1)
   ↓
2. state_name (Required - Step 2)
   ↓
3. service_code OR service_description OR fee_schedule_date (Required - Step 3)
   ↓
4. program (Optional)
   ↓
5. location_region (Optional)
   ↓
6. provider_type (Optional)
   ↓
7. duration_unit (Optional)
   ↓
8. fee_schedule_date (Optional, can be selected earlier)
   ↓
9. modifier_1 (Optional)
```

**Key Behavior:**
- When a filter changes, all **downstream filters** are checked
- If a downstream filter's current value is no longer valid, it's **automatically cleared**
- This prevents invalid filter combinations

### 4. **Dynamic Filter Options Generation**

#### Core Function: `getAvailableOptionsForFilter(filterKey)`

**Purpose**: Returns available options for a specific filter based on current selections.

**Process**:

1. **Special handling for `fee_schedule_date`**:
   - Aggregates dates from `rate_effective_date` column
   - Handles both array and string formats
   - Only considers combinations matching current selections

2. **For all other filters**:
   ```typescript
   filterOptionsData.combinations
     .filter(combo => {
       // 1. Check if fee_schedule_date matches (if selected)
       // 2. Check if all other selections match
       return Object.entries(selections).every(([key, value]) => {
         if (key === filterKey) return true;  // Skip current filter
         if (!value) return true;  // Skip unset selections
         return combo[key] === value;  // Must match
       });
     })
     .map(c => c[filterKey])  // Extract values
     .filter(Boolean)  // Remove empty values
   ```

3. **Custom sorting for `service_code`**:
   - Numeric codes first (sorted numerically)
   - HCPCS codes (letter + numbers) next (alphabetically)
   - Number + letter codes (like 0362T) next
   - Everything else alphabetically

### 5. **Filter Selection Handler**

#### `handleSelectionChange(field, value)`

**Process**:

1. **Creates new selections object** with updated value
2. **Checks dependency chain**:
   - Finds position of changed field in dependency chain
   - For each downstream field:
     - Checks if current value is still valid
     - If not valid, clears it
3. **Special handling for date filters**:
   - If `service_category` or `state_name` changes:
     - Clears `fee_schedule_date`
     - Resets `startDate` and `endDate`
4. **Updates state**:
   - Sets new selections
   - Resets to page 1
   - Marks field as "pending" (for UI feedback)
   - Triggers `loadFilterOptions()` after 100ms debounce

### 6. **Search Execution**

#### `handleSearch()`

**Process**:

1. **Builds filter object** from selections:
   ```typescript
   const filters: any = {};
   for (const [key, value] of Object.entries(selections)) {
     if (value) filters[key] = value;
   }
   if (startDate) filters.start_date = startDate.toISOString().split('T')[0];
   if (endDate) filters.end_date = endDate.toISOString().split('T')[0];
   filters.page = String(currentPage);
   filters.itemsPerPage = String(itemsPerPage);
   ```

2. **Calls API**: `/api/state-payment-comparison?{filters}`

3. **Updates state**:
   - Sets data from response
   - Updates total count
   - Marks as searched

### 7. **Filter Validation**

#### `getAreFiltersApplied()`

**Required filters for search**:
- `service_category` (must be selected)
- `state_name` (must be selected)
- **At least one of**:
  - `service_code` OR
  - `service_description` OR
  - `fee_schedule_date` OR
  - Date range (`startDate` AND `endDate`)

### 8. **Special Features**

#### Blank Entry Handling (`hasBlankEntriesForFilter`)

- **Purpose**: Detects if there are entries with blank/empty values for a filter
- **Use case**: Adds "-" option to dropdowns for filters that have blank entries
- **Applies to**: `program`, `location_region`, `provider_type`, `modifier_1`
- **Excludes**: `duration_unit` (never shows "-" option)

#### Multi-Select Support

- Handles comma-separated values in selections
- Checks if combo value is included in selected values array
- Used for filters that support multiple selections

#### Date Filter Special Handling

- `fee_schedule_date` can be selected from `rate_effective_date` array
- Supports both array and string formats
- When selected, filters all other options to only show matching dates

### 9. **Filter UI Components**

#### Dropdown Options (`getDropdownOptions`)

- **Mandatory filters**: Show only available options
- **Optional filters**: Show "-" option first (if blank entries exist)
- **Secondary filters**: Use `buildSecondaryFilterOptions` for smart "-" handling

#### Clear Buttons

- Each filter has a clear button (X) when selected
- Clicking clears that filter and all dependent filters
- Triggers filter options update

### 10. **Performance Optimizations**

1. **Debouncing**: `loadFilterOptions()` called with 100ms delay
2. **Pending Filters**: Tracks which filters are updating (for UI feedback)
3. **Memoization**: Uses `useCallback` for filter loading functions
4. **Client-side filtering**: Filter options calculated client-side from combinations
5. **Backend filtering**: Actual data filtering done on backend via API

### 11. **Data Flow**

```
1. User selects service_category
   ↓
2. handleSelectionChange('service_category', value)
   ↓
3. Updates selections state
   ↓
4. Marks as pending, triggers loadFilterOptions() (debounced)
   ↓
5. loadFilterOptions() filters combinations based on new selection
   ↓
6. Extracts available options for all filters
   ↓
7. Updates UI with new available options
   ↓
8. User selects state_name
   ↓
9. Process repeats...
   ↓
10. User clicks "Search"
    ↓
11. handleSearch() builds filter object
    ↓
12. Calls /api/state-payment-comparison with filters
    ↓
13. Backend filters data and returns results
    ↓
14. UI displays filtered results
```

### 12. **Key Functions Summary**

| Function | Purpose |
|----------|---------|
| `loadUltraFilterOptions()` | Initial load of filter data from JSON |
| `loadFilterOptions()` | Updates available options based on selections |
| `getAvailableOptionsForFilter(key)` | Returns available options for a filter |
| `handleSelectionChange(field, value)` | Handles filter selection changes |
| `hasBlankEntriesForFilter(key)` | Checks if filter has blank entries |
| `buildSecondaryFilterOptions()` | Builds options with smart "-" handling |
| `getAreFiltersApplied()` | Validates if required filters are set |
| `handleSearch()` | Executes search with current filters |

### 13. **Filter Types**

#### Required Filters (Step-by-step)
1. **service_category**: Service line category (ABA, BH, HCBS, IDD)
2. **state_name**: State name
3. **service_code** OR **service_description** OR **fee_schedule_date**: At least one required

#### Optional Filters
- **program**: Medicaid program type
- **location_region**: Geographic region
- **provider_type**: Type of provider
- **duration_unit**: Time unit for duration
- **modifier_1**: Service modifier code

#### Date Filters
- **fee_schedule_date**: Specific effective date
- **startDate / endDate**: Date range filter

### 14. **Error Handling**

- **Loading errors**: Displayed in `localError` state
- **API errors**: Caught in `refreshData()` and `handleSearch()`
- **Invalid combinations**: Automatically cleared by dependency chain
- **Missing data**: Gracefully handles empty filter options

## Conclusion

The dashboard filter system is a **sophisticated client-side filtering engine** that:

1. **Dynamically updates** available options based on selections
2. **Prevents invalid combinations** through dependency chain
3. **Optimizes performance** with debouncing and memoization
4. **Handles edge cases** like blank entries, multi-select, and date arrays
5. **Provides smooth UX** with pending states and clear buttons

The system ensures users can only select valid filter combinations, making the search experience intuitive and error-free.

