# MediRate - Comprehensive Application Analysis

## Executive Summary

**MediRate** is a Next.js-based SaaS platform for tracking and analyzing Medicaid provider payment rates across all 50 US states and DC. The application provides healthcare organizations with real-time access to payment rate data, legislative updates, customizable email alerts, and comprehensive analytics tools.

---

## 1. Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.2.3 (App Router, React 19, TypeScript)
- **Authentication**: KindeAuth (OAuth-based)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 6.2.1
- **Payments**: Stripe (live keys only)
- **Email Service**: Brevo (formerly Sendinblue)
- **Storage**: 
  - Vercel Blob Storage (documents, filter options)
  - Azure Blob Storage (source Excel files for database updates)
- **Styling**: Tailwind CSS with custom Lemon Milk font
- **Charts/Visualization**: ECharts, Chart.js, Recharts
- **Package Manager**: pnpm (preferred)

### Application Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (79 endpoints)
│   ├── components/        # Shared UI components
│   ├── dashboard/         # Main user dashboard
│   ├── admin-dashboard/   # Admin control panel
│   └── [feature-pages]/   # Feature-specific pages
├── context/               # React Context (AuthContext)
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
└── types/                 # TypeScript definitions
```

---

## 2. Authentication & Access Control System

### Authentication Flow

The application uses a **multi-tiered authentication system** with the following hierarchy:

#### Step 1: Admin Check (Highest Priority)
- Admins bypass all subscription checks
- Checked via `admin_users` table
- Full access to all features
- Unlimited sub-user slots

#### Step 2: Stripe Subscription Check
- Primary users with active Stripe subscriptions
- Professional Plan: $750/month or $8,100/year (10% discount)
- Direct access to premium features

#### Step 3: Sub-User Check
- Users listed in `subscription_users` table
- Checks PRIMARY user's subscription status:
  - First checks Stripe subscription
  - If no Stripe, checks wire transfer subscription
- Sub-users inherit access from primary user
- Regular users: 2 sub-user slots max
- Admin users: Unlimited slots

#### Step 4: Wire Transfer Subscription Check
- Users in `wire_transfer_subscriptions` table with `status = 'active'`
- Treated as having active subscription
- Full premium access

#### Step 5: No Access
- Redirected to `/subscribe` page
- Must complete registration form before account creation

### Access Control Levels

**Public Pages** (No authentication):
- `/` - Home page
- `/aboutus`, `/contactus`, `/oursolution`, `/ourcustomers`
- `/subscribe` - Subscription page

**Authenticated Only**:
- `/profile` - User profile
- `/settings` - Account settings

**Premium Subscription Required**:
- `/dashboard` - Main dashboard
- `/historical-rates` - Historical rate data
- `/rate-developments` - Rate development tracking
- `/state-rate-comparison/*` - State comparisons
- `/email-preferences` - Email alert configuration
- `/documents` - Document library

**Admin Only**:
- `/admin-dashboard` - Admin control panel
- `/admin-dashboard/rate-developments/*` - Rate data management
- `/admin-dashboard/marketing-emails` - Marketing campaigns

### Authentication Implementation

**AuthContext** (`src/context/AuthContext.tsx`):
- Centralized authentication state management
- Provides: `isAuthenticated`, `hasActiveSubscription`, `isSubUser`, `isWireTransferUser`, `isAdmin`
- Automatically initializes email preferences on login
- Runs subscription checks on authentication state changes

**Protection Hooks**:
- `useRequireAuth()` - Redirects unauthenticated users to login
- `useRequireSubscription()` - Enforces premium access
- `useProtectedPage()` - Generic page protection with admin bypass

---

## 3. Subscription Management System

### Subscription Types

#### 1. Stripe Subscriptions
- **Professional Plan**: $750/month or $8,100/year
- Managed via Stripe Checkout
- Webhook handles subscription lifecycle events
- Status tracked in Stripe and synced to database

#### 2. Wire Transfer Subscriptions
- Manual subscription management
- Stored in `wire_transfer_subscriptions` table
- Fields: `user_email`, `status`, `subscriptionStartDate`, `subscriptionEndDate`
- Treated identically to Stripe subscriptions for access control

#### 3. Sub-User System
- Primary users can add sub-users via Settings
- Sub-users stored in `subscription_users` table (JSONB array)
- Sub-users inherit access from primary user
- Slot limits:
  - Regular users: 2 slots maximum
  - Admin users: Unlimited slots
- Sub-users can be added/removed via `/api/add-sub-user` and `/api/add-transferred-user`

### Subscription Workflow

1. **User Registration**:
   - User completes registration form at `/subscribe`
   - Form data stored in `registrationform` table
   - Cookie set: `mr_form_complete=1`

2. **Payment Processing**:
   - Stripe Checkout session created via `/api/stripe/create-checkout-session`
   - User redirected to Stripe payment page
   - On success, redirected to `/auth-callback`

3. **Webhook Processing**:
   - Stripe webhook at `/api/stripe/webhook` handles:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

4. **Access Activation**:
   - Subscription status checked on every page load
   - AuthContext validates access before rendering protected content

---

## 4. Database Schema & Data Management

### Core Tables

#### User Management
- **`User`**: Main user table (PascalCase columns: `UserID`, `Email`, `FirstName`, `LastName`, `KindeUserID`, etc.)
- **`subscription_users`**: Sub-user relationships (`primary_user`, `sub_users` JSONB)
- **`admin_users`**: Admin access control
- **`wire_transfer_subscriptions`**: Manual subscription records

#### Content Tables
- **`bill_track_50`**: Legislative bill tracking
  - Fields: `url` (PK), `state`, `bill_number`, `service_lines_impacted` (4 columns), `is_new`, etc.
- **`provider_alerts`**: Provider rate alerts
  - Fields: `id` (PK), `state`, `service_lines_impacted` (4 columns), `is_new`, `link`, `subject`, etc.
- **`state_plan_amendments`**: SPA/Waiver Amendments
  - Similar structure to `provider_alerts`
- **`service_category_list`**: Service categories for filtering
- **`master_data_sept_2`**: Historical rate data (large table)

#### User Preferences
- **`user_email_preferences`**: Email alert preferences (JSONB)
  - Structure: `{ states: [], categories: [] }`
- **`email_verifications`**: Email verification codes
- **`registrationform`**: User registration data

#### System Tables
- **`admin_logs`**: System operation logs
- **`excel_export_usage`**: Excel export row limit tracking (20,000 rows/month per subscription)

### Database Update Process

**Location**: `/api/admin/update-database`

**Supported Update Types**:
1. **BillTrack** (`?type=billtrack`): Updates `bill_track_50`
2. **Provider Alerts** (`?type=provider_alerts`): Updates `provider_alerts`
3. **State Plan Amendments** (`?type=state_plan_amendments`): Updates `state_plan_amendments`

**Process Flow**:

1. **Connection & Download**:
   - Connects to Azure Blob Storage via `AZURE_CONNECTION_STRING`
   - Downloads Excel file:
     - BillTrack: `"Medicaid Rates bill sheet with categories.xlsx"`
     - Provider Alerts: `"provideralerts_data.xlsx"`
     - SPAs: `"state_plan_amendments.xlsx"`

2. **Excel Parsing**:
   - Parses workbook using `xlsx` library
   - BillTrack: Finds latest sheet in MMDDYY format (e.g., `010125`)
   - Maps Excel columns to database columns (PascalCase)

3. **Database Operations**:
   - Resets all `is_new` flags to `'no'`
   - Fetches existing records
   - Compares Excel data with database
   - Inserts new entries with `is_new = 'yes'`
   - Updates changed entries (BillTrack only; Provider Alerts and SPAs are insert-only)

**Service Line Protection**:
- Service line fields (`service_lines_impacted`, `service_lines_impacted_1`, `service_lines_impacted_2`, `service_lines_impacted_3`) are:
  - ✅ Set during initial creation
  - 🛡️ Protected from overwriting during updates
  - 🔒 Only modifiable via frontend edit interface

---

## 5. Email Alert System

### Alert Detection

**Location**: `/api/admin/send-email-alerts`

**Process**:
1. Fetches entries with `is_new = 'yes'` from:
   - `bill_track_50`
   - `provider_alerts`
   - `state_plan_amendments`

2. Processes service lines from all 4 columns for provider alerts and SPAs

3. Matches users based on:
   - State preferences (from `user_email_preferences`)
   - Service line/category preferences

### Email Generation

**Email Structure**:
- Groups alerts by type (bills, provider_alerts, state_plan_amendment)
- Generates category sections only if alerts exist
- Uses `link` field for SPAs, `url` field for others
- Formats dates correctly
- HTML email with MediRate branding

**Sending**:
- Uses Brevo API (`BREVO_API_KEY`)
- Sender: `contact@medirate.net`
- Subject: `"New Medicaid Alerts Relevant to You - {count} Updates"`
- Sends to users with matching preferences

**Modes**:
- `preview`: Shows what would be sent (no emails)
- `test`: Sends to test email list
- `production`: Sends to all matching users

**Note**: `is_new` flags are NOT reset after sending (allows re-sending if needed)

### Email Preferences

Users can configure preferences at `/email-preferences`:
- Select states to monitor
- Select service categories to track
- Preferences stored in `user_email_preferences` table (JSONB)

---

## 6. Document Library System

### Storage Architecture

**Service**: Vercel Blob Storage
**Structure**: `STATE_NAME/SUBFOLDER/FILENAME.EXTENSION`

**Common Subfolders**:
- `ABA` - Applied Behavior Analysis
- `BH` - Behavioral Health
- `BILLING_MANUALS` - Billing documentation
- `IDD` - Intellectual and Developmental Disabilities
- `HCBS` - Home and Community-Based Services

**Archive Folders**:
- Folders ending with `_ARCHIVE` are hidden from website UI
- Still accessible via direct URLs
- Used for historical/archived documents

### API Endpoints

- `GET /api/documents` - List all documents (excludes archives)
- `GET /api/documents/structure` - Get hierarchical folder structure
- `GET /api/documents/download` - Generate download URL
- `POST /api/documents/upload` - Upload documents (admin only)
- `POST /api/documents/create-archives` - Create archive folders (admin only)

### Document Management

**Frontend**: `/documents` page
- Displays documents by state and subfolder
- Search and filter functionality
- Download links with authentication
- Archive folders hidden from UI

**Scripts** (in `scripts/`):
- `verify-and-sync-all-states.ts` - Sync local files with blob storage
- `compare-local-vs-blob.ts` - Compare local vs cloud storage
- `merge-local-and-blob.ts` - Merge local and cloud files
- `create-south-dakota-folders.ts` - Create folder structure for new states

---

## 7. Data Features & Analytics

### Dashboard Features

**Main Dashboard** (`/dashboard`):
- Overview of rate data
- Recent updates
- Quick access to key features
- Subscription status display

**Historical Rates** (`/historical-rates`):
- Historical rate tracking by state
- Time-series visualizations
- Filter by state, service, date range

**Rate Developments** (`/rate-developments`):
- Latest rate development alerts
- Filter by state, category, date
- Links to source documents
- Mark as read/unread functionality

**State Rate Comparison**:
- `/state-rate-comparison/all` - Compare all states
- `/state-rate-comparison/individual` - Individual state deep dive
- Interactive charts and tables
- Export to Excel (20,000 row limit per subscription/month)

### Data Sources

**Filter Options**:
- Stored in Vercel Blob Storage
- Endpoint: `/api/filter-options`
- Contains: states, categories, service codes, etc.
- Cached in memory for performance

**Enhanced Metrics**:
- Pre-computed metrics stored in JSON files
- Endpoint: `/api/enhanced-metrics`
- Used for dashboard visualizations

**Code Definitions**:
- HCPCS/CPT code definitions
- Endpoint: `/api/code-definations`
- Batch processing for large datasets

---

## 8. Admin Dashboard Features

### Rate Developments Management

**Location**: `/admin-dashboard/rate-developments`

**Features**:
- View all rate developments (bills, provider alerts, SPAs)
- Edit entries (including service lines)
- Delete entries
- Update database from Azure Blob Storage
- Send email alerts to users

**Database Update**:
- `/admin-dashboard/rate-developments/update-database`
- Supports three update types (see Database Update Process above)
- Real-time logging and progress tracking
- Admin authentication required

**Email Alerts**:
- `/admin-dashboard/rate-developments/send-email-alerts`
- Preview mode (no emails sent)
- Test mode (sends to test list)
- Production mode (sends to all matching users)
- Detailed logs of email sending process

### Marketing Emails

**Location**: `/admin-dashboard/marketing-emails`

**Features**:
- Create marketing campaigns
- AI-powered template generation (`/api/admin/marketing-emails/generate-ai-template`)
- Email list management
- Send campaigns
- Analytics and bounce tracking
- Contact statistics

### User Management

**Features**:
- View all users
- Manage subscriptions
- Add/remove sub-users
- Suspend/unsuspend accounts
- View user activity logs

---

## 9. API Architecture

### API Route Structure

**Authentication APIs**:
- `POST /api/sync-kinde-user` - Sync Kinde user to database
- `GET /api/auth-check` - Validate session
- `GET /api/subscription-users` - Check sub-user status
- `POST /api/check-email-access` - Check access (Stripe, wire transfer, sub-user)

**User Management APIs**:
- `GET /api/user/profile` - Get user profile (bypasses RLS)
- `PUT /api/user/profile` - Update profile
- `GET /api/user/email-preferences` - Get email preferences
- `PUT /api/user/email-preferences` - Update preferences
- `POST /api/user/initialize-email-preferences` - Initialize preferences on login

**Subscription APIs**:
- `POST /api/stripe/subscription` - Check subscription status
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/webhook` - Handle Stripe webhooks
- `POST /api/add-sub-user` - Add sub-user
- `GET /api/wire-transfer-subscriptions` - Get wire transfer status

**Data APIs**:
- `GET /api/filter-options` - Get filter options (from blob storage)
- `GET /api/service-categories` - Get service categories
- `GET /api/code-definations` - Get code definitions
- `GET /api/state-payment-comparison` - State comparison data
- `GET /api/legislative-updates` - Legislative updates
- `GET /api/enhanced-metrics` - Enhanced metrics
- `GET /api/recent-rate-changes` - Recent changes

**Document APIs**:
- `GET /api/documents` - List documents
- `GET /api/documents/structure` - Get folder structure
- `GET /api/documents/download` - Download document
- `POST /api/documents/upload` - Upload (admin only)

**Admin APIs**:
- `POST /api/admin/check-access` - Check admin access
- `POST /api/admin/update-database` - Update database from Azure
- `POST /api/admin/send-email-alerts` - Send email alerts
- `GET /api/admin/rate-data` - Rate data management
- `GET /api/admin/user-management` - User management
- `POST /api/admin/marketing-emails/*` - Marketing email management

### Security

**Row Level Security (RLS)**:
- Enabled on most Supabase tables
- Server-side APIs use service role to bypass RLS
- Client-side queries respect RLS policies

**Admin Authentication**:
- Validated via `validateAdminAuth()` from `@/lib/admin-auth`
- Checks `admin_users` table
- Required for all admin endpoints

---

## 10. Key Workflows

### User Registration & Onboarding

1. User visits `/subscribe`
2. Completes registration form
3. Cookie set: `mr_form_complete=1`
4. Redirected to Stripe Checkout
5. Payment processed
6. Webhook creates subscription record
7. User redirected to `/auth-callback`
8. Email preferences initialized
9. Welcome email sent

### Rate Development Alert Flow

1. Admin updates database from Azure Blob Storage
2. New entries marked with `is_new = 'yes'`
3. Admin triggers email alert send
4. System fetches entries with `is_new = 'yes'`
5. Matches users based on preferences
6. Generates personalized email
7. Sends via Brevo API
8. Logs sent to admin dashboard

### Sub-User Management Flow

1. Primary user navigates to Settings
2. Clicks "Manage Subscription Users"
3. Adds sub-user email
4. System checks slot availability
5. Sub-user added to `subscription_users` table
6. Emails sent:
   - To sub-user: Welcome email
   - To primary user: Confirmation email
7. Sub-user can now log in and access premium features

### Document Upload Flow

1. Admin navigates to Documents page
2. Selects state and subfolder
3. Uploads file(s)
4. Files stored in Vercel Blob Storage
5. Path: `{STATE}/{SUBFOLDER}/{FILENAME}`
6. Document immediately available to users
7. Archive folders can be created for historical documents

---

## 11. Environment Configuration

### Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE=...

# Authentication
KINDE_CLIENT_ID=...
KINDE_CLIENT_SECRET=...
KINDE_ISSUER_URL=...
KINDE_SITE_URL=...
KINDE_POST_LOGOUT_REDIRECT_URL=...
KINDE_POST_LOGIN_REDIRECT_URL=...

# Payments (LIVE KEYS ONLY)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=...

# Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
AZURE_CONNECTION_STRING=...
CONTAINER_NAME=...
```

---

## 12. Development Guidelines

### Code Standards

1. **Database Columns**: Always use PascalCase (e.g., `FirstName`, `Email`, `UserID`)
2. **Authentication**: Use centralized AuthContext and hooks
3. **Package Manager**: Use `pnpm` instead of `npm`
4. **Icons**: Use Lucide React icons only
5. **Styling**: Tailwind CSS with custom theme
6. **TypeScript**: Strict mode enabled

### Common Patterns

**Protected Pages**:
```typescript
const auth = useRequireSubscription();
if (auth.isLoading) return <Loading />;
```

**Admin Pages**:
```typescript
const { isAdmin } = useProtectedPage();
if (!isAdmin) return <Unauthorized />;
```

**API Routes**:
```typescript
// Use service role for RLS bypass
const supabase = createServiceClient();

// Validate admin access
const { validateAdminAuth } = await import("@/lib/admin-auth");
const { user, error } = await validateAdminAuth();
```

### Testing

- Playwright tests in `tests/` directory
- Test files: `dashboard.spec.ts`, `example-user-flow.spec.ts`

---

## 13. Known Limitations & Considerations

1. **Excel Export Limit**: 20,000 rows per subscription per month
2. **Sub-User Slots**: Regular users limited to 2 slots (admins unlimited)
3. **Service Line Protection**: Service lines protected from automated updates
4. **Archive Folders**: Hidden from UI but accessible via direct URLs
5. **Email Preferences**: Must be initialized on first login
6. **Database Updates**: Only BillTrack supports updates; Provider Alerts and SPAs are insert-only

---

## 14. Future Enhancements (Potential)

1. Real-time notifications (WebSocket/SSE)
2. Advanced analytics dashboard
3. Custom report builder
4. API access for enterprise customers
5. Multi-tenant organization support
6. Enhanced document search (full-text)
7. Rate change predictions (ML/AI)
8. Mobile app (React Native)

---

## Conclusion

MediRate is a comprehensive, production-ready SaaS platform with robust authentication, subscription management, data processing, and user management systems. The architecture is scalable, secure, and well-organized, with clear separation of concerns and centralized authentication/authorization systems.

The application successfully handles:
- Multi-tiered access control (admin, subscription, sub-user, wire transfer)
- Complex data synchronization from Azure Blob Storage
- Personalized email alert system
- Document library management
- Payment processing and subscription lifecycle
- Admin tools for content and user management

---

**Last Updated**: January 2025
**Version**: 2.0.0

