# Export Functionality - Comprehensive Analysis

## Overview
The MediRate application has a sophisticated export system that allows users to export rate data in Excel and CSV formats with usage tracking, row limits, and data protection features.

---

## Export Locations & Types

### 1. Dashboard Export (`/dashboard`)
**Two Export Methods:**
- **Excel Export** (`handleExportExcel`) - Password-protected Excel files
- **CSV Export** (`handleExport`) - Plain CSV files with watermark headers/footers

### 2. Data Export Page (`/data-export`)
**Single Export Method:**
- **Custom Excel Export** - Advanced export with column selection, custom filters, and templates

---

## Export Features & Capabilities

### Core Features
1. **Row Limit Tracking**: 20,000 rows per subscription per month
2. **Usage Monitoring**: Real-time tracking of export usage
3. **Billing Period Reset**: Monthly reset based on subscription type
4. **Data Protection**: Password protection (Excel) and watermarks (CSV)
5. **Pagination**: Fetches all data in chunks (1000 rows per page)
6. **Filter Preservation**: Exports respect all active filters and sorting
7. **Column Selection**: (Data Export page only) Choose specific columns to export

---

## Export Flow & Architecture

### High-Level Flow
```
User Clicks Export
    ↓
Check Total Row Count
    ↓
Check Usage Limits (GET /api/excel-export/check-usage)
    ↓
Validate Row Count vs Remaining
    ↓
Reserve Rows (POST /api/excel-export/check-usage)
    ↓
Fetch All Data (Paginated - 1000 rows/page)
    ↓
Generate File (Excel/CSV)
    ↓
Download File
    ↓
Update Usage Display
```

---

## Usage Tracking System

### Database Table: `excel_export_usage`
**Schema:**
```sql
- id (primary key)
- primary_user_email (string) - Subscription owner's email
- subscription_type ('stripe' | 'wire_transfer')
- current_period_start (timestamp)
- current_period_end (timestamp)
- rows_used (integer)
- rows_limit (integer) - Default: 20,000
```

### Usage Record Management
**Key Functions:**
1. **`getPrimaryUserEmail()`** - Determines subscription owner
   - Checks if user is sub-user → returns primary user email
   - Checks Stripe subscription → returns user's email
   - Checks wire transfer subscription → returns user's email
   - Default: returns user's email

2. **`getBillingPeriod()`** - Calculates billing period dates
   - **Stripe**: Uses `current_period_start` and `current_period_end` from Stripe API
   - **Wire Transfer**: Calculates monthly cycles from `subscription_start_date`
     - Resets on anniversary day (same day of month as start date)
     - Handles edge cases (e.g., Jan 31 → Feb 28/29)

3. **`getOrCreateUsageRecord()`** - Manages usage records
   - Creates record if doesn't exist
   - Resets `rows_used` to 0 if billing period has ended
   - Returns current usage stats

### Monthly Reset Logic
**Stripe Subscriptions:**
- Reset occurs when `current_period_end` passes
- Uses Stripe's billing cycle dates directly

**Wire Transfer Subscriptions:**
- Reset occurs on anniversary day of each month
- Example: If subscription started on Jan 15, resets on 15th of each month
- Handles months with fewer days (e.g., Jan 31 → Feb 28/29)

---

## API Endpoints

### GET `/api/excel-export/check-usage`
**Purpose**: Get current usage statistics

**Response:**
```typescript
{
  rowsUsed: number;
  rowsLimit: number;
  rowsRemaining: number;
  currentPeriodStart: string; // ISO date
  currentPeriodEnd: string; // ISO date
  canExport: boolean;
  primaryUserEmail?: string;
  userRole?: 'subscription_manager' | 'primary_user' | 'sub_user';
}
```

**Logic:**
1. Authenticates user via KindeAuth
2. Gets primary user email (handles sub-users)
3. Gets or creates usage record
4. Calculates remaining rows
5. Returns usage info

### POST `/api/excel-export/check-usage`
**Purpose**: Reserve rows before export

**Request Body:**
```typescript
{
  rowCount: number; // Number of rows to reserve
}
```

**Response:**
```typescript
{
  canExport: boolean;
  rowsUsed: number; // Updated after reservation
  rowsLimit: number;
  rowsRemaining: number; // Updated after reservation
  requestedRows: number;
  message: string;
}
```

**Logic:**
1. Validates row count
2. Checks if export is allowed (rowCount <= rowsRemaining)
3. Updates `rows_used` in database (reserves rows)
4. Returns updated usage stats

**Error Cases:**
- Returns `canExport: false` if `rowCount > rowsRemaining`
- Returns error if database update fails

---

## Dashboard Export Functions

### Excel Export (`handleExportExcel`)

**Location**: `src/app/dashboard/page.tsx`

**Process:**
1. **Validation**: Checks if search has been performed
2. **Build Filters**: Collects all active filters and sorting
3. **Get Total Count**: Fetches count to validate export size
4. **Check Usage**: Validates against row limits
5. **Reserve Rows**: Reserves rows via POST API
6. **Fetch All Data**: Paginated fetch (1000 rows/page) until all data retrieved
7. **Create Excel File**:
   - Creates "Notice" sheet with copyright info
   - Creates "Data" sheet with actual data
   - Applies password protection: `MEDIRATE2025`
   - Locks all cells (read-only)
8. **Download**: Generates blob and triggers download

**Excel Features:**
- **Password Protection**: `MEDIRATE2025` (users need this to unprotect)
- **Cell Locking**: All data cells are locked
- **Sheet Protection**: Prevents editing, sorting, filtering
- **Notice Sheet**: Contains copyright and export metadata
- **Styling**: Header row with blue background (#012C61)

**Columns Exported:**
- State (abbreviated)
- Service Category (abbreviated)
- Service Code
- Service Description
- Rate per Base Unit (formatted as currency)
- Duration Unit
- Effective Date (formatted MM/DD/YYYY)
- Provider Type
- Modifier 1-4 (with details if available)
- Program
- Location/Region

**File Naming**: `MediRate-export-{timestamp}.xlsx`

### CSV Export (`handleExport` / `performCsvExport`)

**Location**: `src/app/dashboard/page.tsx`

**Process:**
1. **Validation**: Checks if search has been performed
2. **Build Filters**: Collects all active filters and sorting
3. **Get Total Count**: Fetches count to validate export size
4. **Check Usage**: Validates against row limits
5. **Show Warning Modal**: Displays usage info and requires confirmation
6. **Reserve Rows**: Reserves rows via POST API
7. **Fetch All Data**: Paginated fetch (1000 rows/page)
8. **Generate CSV**:
   - Adds watermark header (proprietary data notice)
   - Adds data rows with proper CSV escaping
   - Adds watermark footer
9. **Download**: Creates blob and triggers download

**CSV Features:**
- **Watermark Header**: Multiple rows with copyright notice
- **CSV Escaping**: Properly escapes commas, quotes, newlines
- **Encoding Fix**: Uses `fixEncoding()` to handle special characters
- **Watermark Footer**: Additional copyright notice at end

**CSV Format:**
```
MEDIRATE - PROPRIETARY DATA
Copyright © 2025 MediRate. All Rights Reserved.
[Empty row]
State,Service Category,Service Code,...
[Data rows]
[Empty row]
MEDIRATE - PROPRIETARY DATA
Copyright © 2025 MediRate. All Rights Reserved.
Generated by MediRate Dashboard
```

**File Naming**: `MediRate-export-{timestamp}.csv`

---

## Data Export Page (`/data-export`)

### Features
1. **Custom Column Selection**: Choose exactly which columns to export
2. **Advanced Filtering**: Same filter system as dashboard
3. **Template System**: Save and load export configurations
4. **Usage Display**: Real-time usage statistics with progress bar
5. **Row Count Preview**: Shows how many rows current selection contains

### Export Process (`prepareExport` → `confirmExport`)

**Step 1: Prepare Export**
1. Validates column selection (at least 1 column required)
2. Checks usage and gets total row count in parallel
3. Validates row count vs remaining rows
4. Shows review modal with:
   - Row count
   - Rows remaining after export
   - Selected columns list
   - Usage summary

**Step 2: Confirm Export**
1. Reserves rows via POST API
2. Fetches all data (paginated, 1000 rows/page)
3. Builds Excel file with selected columns only
4. Downloads file
5. Updates usage display

### Excel File Structure

**Notice Sheet:**
- Proprietary data notice
- Copyright information
- Export date and time
- Total records count
- Filters applied summary

**Data Sheet:**
- Custom column headers (based on selection)
- Styled header row (blue background, white text)
- Data rows with proper formatting
- Column widths auto-adjusted

**File Naming**: `medirate-export-{timestamp}.xlsx`

### Column Options
**Total Available Columns**: 40+ columns from `master_data_sept_2` table

**Key Columns:**
- Basic Info: ID, State, Service Category, Service Code, Service Description
- Rate Info: Rate, Rate per Hour, Effective Date, Duration Unit
- Modifiers: Modifier 1-4 with details
- Program Info: Program, Location/Region, Provider Type
- Metadata: Created At, Updated At, Filename, Page Number
- And more...

**Column Formatters:**
- **Rate**: Formats as currency (`$123.45`)
- **Date Fields**: Formats as MM/DD/YYYY
- **Encoding**: All text fields use `fixEncoding()` for special characters

---

## Data Fetching Strategy

### Pagination
**Page Size**: 1000 rows per API call

**Algorithm:**
```typescript
let page = 1;
let hasMore = true;
const allData = [];

while (hasMore) {
  const response = await fetch(`/api/state-payment-comparison?page=${page}&itemsPerPage=1000&...`);
  const result = await response.json();
  
  allData.push(...result.data);
  
  // Check if we've fetched all data
  if (allData.length >= result.totalCount || result.data.length < 1000) {
    hasMore = false;
  } else {
    page++;
  }
}
```

**Benefits:**
- Reduces memory usage
- Handles large datasets efficiently
- Prevents timeout issues

---

## Filter & Sort Preservation

### Filters Applied
All active filters are preserved in export:
- Service Category
- State (can be multiple)
- Service Code (can be multiple)
- Service Description (can be multiple)
- Program (can be multiple)
- Location/Region (can be multiple)
- Provider Type (can be multiple)
- Duration Unit (can be multiple)
- Modifier 1 (can be multiple)
- Fee Schedule Date
- Start Date / End Date range

### Sorting Applied
- Multi-column sorting supported
- Format: `sort=field1:asc,field2:desc`
- Applied to exported data

---

## Data Formatting

### Rate Formatting
```typescript
formatRate(rate: string): string
// Input: "123.45" or "$123.45"
// Output: "$123.45" or "-" if invalid
```

### Date Formatting
```typescript
formatDate(dateString: string): string
// Input: ISO date string or Date object
// Output: "MM/DD/YYYY" or "" if invalid
```

### Encoding Fix
```typescript
fixEncoding(text: string): string
// Handles special characters, em dashes, quotes, etc.
// Ensures proper display in Excel/CSV
```

### Modifier Formatting
```typescript
formatModifierForExport(modifier: string, details: string): string
// Output: "MODIFIER - Details" or "MODIFIER" if no details
```

### State Abbreviations
- Full state names converted to 2-letter codes
- Example: "ALABAMA" → "AL"

### Service Category Abbreviations
- Long names abbreviated
- Example: "APPLIED BEHAVIOR ANALYSIS" → "ABA"

---

## Error Handling

### Validation Errors
- **No Search Performed**: Alert user to search first
- **No Data**: Alert if no data matches filters
- **No Columns Selected**: Alert if trying to export with 0 columns (Data Export page)
- **Invalid Row Count**: API returns error if rowCount < 0

### Usage Limit Errors
- **Exceeds Remaining**: Shows modal with limit info
- **Reservation Failed**: Alert with error message
- **API Errors**: Catches and displays user-friendly messages

### Data Fetching Errors
- **Page Fetch Failed**: Throws error with page number
- **Network Errors**: Caught and displayed to user
- **Invalid Response**: Validates response structure

---

## User Experience Features

### Loading States
- **`isExporting`**: Shows spinner during export
- **`isPreparingExport`**: Shows spinner during preparation
- **Progress Logging**: Console logs for debugging

### Modals & Confirmations
1. **Usage Limit Modal**: Shown when export exceeds remaining rows
2. **CSV Warning Modal**: (Dashboard) Shows usage info before CSV export
3. **Review Modal**: (Data Export) Shows export summary before confirming

### Success Messages
- Excel Export: Shows success with row count and remaining rows
- CSV Export: Console log with filename
- Data Export: Alert with export summary

### Usage Display
- **Progress Bar**: Visual representation of usage percentage
- **Color Coding**: 
  - Green (< 75%)
  - Amber (75-90%)
  - Red (≥ 90%)
- **Reset Date**: Shows when usage resets
- **Real-time Updates**: Refreshes after each export

---

## Security & Protection Features

### Excel Protection
- **Password**: `MEDIRATE2025`
- **Cell Locking**: All data cells locked
- **Sheet Protection**: Prevents editing, sorting, filtering
- **Notice Sheet**: Contains copyright and legal notices

### CSV Protection
- **Watermark Headers**: Multiple rows with copyright notice
- **Watermark Footers**: Additional copyright notice
- **Encoding**: Proper character encoding to prevent corruption

### Usage Tracking
- **Per Subscription**: Tracks usage per primary user
- **Sub-user Support**: Sub-users share primary user's limit
- **Wire Transfer Support**: Separate tracking for wire transfer subscriptions
- **Monthly Reset**: Automatic reset prevents abuse

---

## Performance Optimizations

### Pagination
- Fetches data in 1000-row chunks
- Reduces memory usage
- Prevents timeout issues

### Parallel Operations
- Usage check and row count fetched in parallel (Data Export page)
- Primary user info and usage check in parallel (Dashboard CSV)

### Efficient Data Processing
- Uses `fixEncoding()` only when needed
- Formats data during export (not during fetch)
- Streams data directly to file (no intermediate storage)

---

## Edge Cases Handled

### Billing Period Reset
- **Stripe**: Handles canceled subscriptions that are still active
- **Wire Transfer**: Handles months with fewer days (Jan 31 → Feb 28/29)
- **Period End**: Automatically resets when period ends

### Sub-user Handling
- Sub-users share primary user's export limit
- Usage tracked per primary user email
- Sub-users see primary user's usage stats

### Large Datasets
- Pagination handles datasets of any size
- Progress logging for debugging
- Error handling for network issues

### Empty Data
- Validates data exists before export
- Shows appropriate error messages
- Handles zero-row exports gracefully

### Invalid Dates
- Date formatting handles invalid dates
- Returns empty string for invalid dates
- Handles Excel serial dates

### Special Characters
- `fixEncoding()` handles em dashes, quotes, etc.
- CSV escaping handles commas, quotes, newlines
- Proper UTF-8 encoding

---

## File Structure Examples

### Excel File Structure
```
Workbook
├── Notice Sheet
│   ├── MEDIRATE - PROPRIETARY DATA
│   ├── Copyright notice
│   ├── Export date
│   └── Total records
└── Data Sheet
    ├── Header Row (styled, locked)
    └── Data Rows (all locked)
```

### CSV File Structure
```
[Watermark Header - 3-4 rows]
[Empty row]
[CSV Headers]
[Data rows]
[Empty row]
[Watermark Footer - 3-4 rows]
```

---

## API Integration

### Data Source
**Endpoint**: `/api/state-payment-comparison`

**Parameters:**
- All filter parameters
- `page`: Page number
- `itemsPerPage`: Items per page (1000 for exports)
- `sort`: Sort configuration

**Response:**
```typescript
{
  data: ServiceData[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
}
```

---

## Template System (Data Export Page)

### Save Templates
- Saves filter selections
- Saves date ranges
- Saves column selections
- Stored in browser/localStorage

### Load Templates
- Restores all saved settings
- Applies filters automatically
- Selects saved columns
- Sets date ranges

---

## Key Differences: Dashboard vs Data Export

| Feature | Dashboard | Data Export |
|---------|-----------|-------------|
| **Export Formats** | Excel + CSV | Excel only |
| **Column Selection** | Fixed columns | Custom column selection |
| **Templates** | No | Yes (save/load) |
| **Password Protection** | Excel only | Excel only |
| **Watermarks** | CSV only | No (Excel only) |
| **Usage Display** | Basic | Advanced (progress bar) |
| **Review Modal** | CSV only | Always shown |
| **Filter Options** | Standard | Advanced (more options) |

---

## Technical Implementation Details

### Libraries Used
- **ExcelJS**: Excel file generation
- **fixEncoding**: Character encoding fixes
- **fflate**: Filter options decompression

### Browser APIs
- **Blob**: File creation
- **URL.createObjectURL**: Download URLs
- **document.createElement('a')**: Download trigger

### State Management
- React hooks for state
- `useState` for UI state
- `useEffect` for side effects
- `useMemo` for computed values

---

## Potential Improvements

1. **Export Progress**: Show progress bar during large exports
2. **Export History**: Track export history per user
3. **Export Scheduling**: Schedule recurring exports
4. **Export Notifications**: Email when export completes
5. **Export Formats**: Add JSON, XML formats
6. **Compression**: Compress large Excel files
7. **Chunked Downloads**: Stream very large files
8. **Export Validation**: Validate data before export
9. **Export Templates**: Server-side template storage
10. **Export Analytics**: Track export patterns

---

## Error Scenarios & Handling

### Scenario 1: Export Exceeds Limit
**Handling**: Shows modal with limit info, prevents export

### Scenario 2: Network Failure During Fetch
**Handling**: Catches error, shows user-friendly message, allows retry

### Scenario 3: Reservation Fails After Count Check
**Handling**: Shows error message, doesn't proceed with export

### Scenario 4: Billing Period Changes During Export
**Handling**: Usage record automatically resets, new period starts

### Scenario 5: Sub-user Export
**Handling**: Uses primary user's limit, tracks under primary user email

---

## Testing Considerations

### Test Cases
1. Export with various filter combinations
2. Export with different row counts (small, medium, large)
3. Export at billing period boundary
4. Sub-user export functionality
5. Wire transfer user export
6. Export with special characters in data
7. Export with invalid dates
8. Export with empty results
9. Export limit exceeded scenarios
10. Network failure scenarios

---

## Database Schema

### excel_export_usage Table
```sql
CREATE TABLE excel_export_usage (
  id SERIAL PRIMARY KEY,
  primary_user_email VARCHAR NOT NULL,
  subscription_type VARCHAR NOT NULL, -- 'stripe' or 'wire_transfer'
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  rows_used INTEGER DEFAULT 0,
  rows_limit INTEGER DEFAULT 20000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(primary_user_email, subscription_type)
);
```

---

## Summary

The export functionality is a comprehensive system that:
- ✅ Tracks usage per subscription (20,000 rows/month)
- ✅ Supports both Excel and CSV formats
- ✅ Provides password protection and watermarks
- ✅ Handles large datasets efficiently
- ✅ Supports sub-users and wire transfer users
- ✅ Automatically resets monthly
- ✅ Provides real-time usage feedback
- ✅ Offers advanced customization (Data Export page)
- ✅ Preserves filters and sorting
- ✅ Handles edge cases gracefully

**Last Updated**: January 2025
**Complexity**: High (multi-format, usage tracking, billing period logic)
**Files**: 
- `src/app/dashboard/page.tsx` (Excel + CSV exports)
- `src/app/data-export/page.tsx` (Custom Excel export)
- `src/app/api/excel-export/check-usage/route.ts` (Usage API)


