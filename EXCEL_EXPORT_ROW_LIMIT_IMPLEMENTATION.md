# Excel Export Row Limit Implementation

## Overview
This feature implements a 20,000 row limit per subscription for Excel exports. The limit is shared across all users in a subscription (primary user + sub-users) and resets monthly based on the subscription billing cycle.

## Files Created/Modified

### 1. Database Table
**File:** `create_excel_export_usage_table.sql`
- Creates `excel_export_usage` table to track row usage per subscription
- Tracks by primary user email and subscription type (stripe/wire_transfer)
- Stores current billing period and usage count
- Auto-resets when billing period ends

### 2. Backend API
**File:** `src/app/api/excel-export/check-usage/route.ts`
- **GET**: Returns current usage info (rows used, limit, remaining, period dates)
- **POST**: Validates and reserves rows before export
- Handles both Stripe and wire transfer subscriptions
- Automatically creates usage record if doesn't exist
- Automatically resets usage when billing period ends

### 3. Frontend Integration
**File:** `src/app/dashboard/page.tsx`
- Added state for usage tracking
- Added `checkExportUsage()` function
- Modified `handleExportExcel()` to:
  1. Get total row count first
  2. Check usage limits
  3. Show modal if limit exceeded
  4. Reserve rows before export
  5. Show success message with remaining rows
- Added usage info display banner
- Added limit exceeded modal

## How It Works

### For Stripe Subscriptions:
1. Uses `current_period_start` and `current_period_end` from Stripe subscription
2. Resets usage when `current_period_end` is passed

### For Wire Transfer Subscriptions:
1. Calculates monthly cycles from `subscription_start_date`
2. Determines current month based on months since start date
3. Sets period start/end to first/last day of current month
4. Resets usage at end of each month

### User Flow:
1. User clicks "Export Excel"
2. System fetches total row count for current filters
3. System checks current usage
4. If limit exceeded → Shows modal with error
5. If within limit → Reserves rows and proceeds with export
6. After export → Shows success message with remaining rows

## Key Features

✅ **Shared Limit**: All users in a subscription share the same 20k row limit
✅ **Monthly Reset**: Automatically resets at end of billing period
✅ **Auto-Create**: Creates usage record on first export
✅ **Auto-Reset**: Resets usage when period ends
✅ **Real-time Validation**: Checks limits before allowing export
✅ **User Feedback**: Shows usage info and clear error messages

## SQL Command

Run the SQL file to create the table:
```sql
-- See create_excel_export_usage_table.sql
```

## Testing Scenarios

1. **First Export**: Should create usage record automatically
2. **Within Limit**: Should allow export and update usage
3. **Limit Exceeded**: Should show modal and block export
4. **Monthly Reset**: Should reset usage when period ends
5. **Sub-User**: Should use primary user's limit
6. **Wire Transfer**: Should calculate monthly cycles correctly

## Next Steps

1. Run the SQL migration to create the table
2. Test the implementation with various scenarios
3. Monitor usage patterns
4. Adjust limit if needed (currently 20,000 rows)

