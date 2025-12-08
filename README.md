# MediRate - Comprehensive Project Documentation

## 🤖 FOR AI ASSISTANTS - READ THIS FIRST

**If you are an AI assistant helping with this project, please read this entire document before making any code changes or suggestions.**

### Critical Instructions:
1. **ALWAYS** read this documentation completely before starting work
2. **NEVER** assume database column names - they are ALL PascalCase (e.g., `Email`, `FirstName`, `UserID`)
3. **ALWAYS** use the centralized authentication system (`useAuth`, `useRequireAuth`, `useRequireSubscription`)
4. **NEVER** create new authentication logic - use existing hooks
5. **ALWAYS** update this documentation when making significant changes
6. **REFER** to the "Known Issues & Fixes" section for common problems
7. **ASK** clarifying questions about database setup if unsure
8. **USE** Lucide icons only
9. **AVOID** emojis in code/output
10. **RESPECT** dark mode preference

### Common Mistakes to Avoid:
- ❌ Using camelCase database columns (`firstName` ❌) - Use PascalCase (`FirstName` ✅)
- ❌ Creating new auth logic - Use existing centralized system
- ❌ Assuming database structure - Check this documentation first
- ❌ Ignoring Row Level Security (RLS) - Use service role APIs when needed
- ❌ Breaking existing functionality - Test authentication flows

---

## 📋 PROJECT OVERVIEW

**MediRate** is a comprehensive Medicaid rate tracking and analysis platform that provides healthcare organizations with real-time access to payment rate data, legislative updates, and customizable email alerts across all 50 states and the District of Columbia.

### Core Purpose
- Track Medicaid provider payment rates across states
- Monitor legislative changes affecting reimbursement
- Provide customizable email alerts for rate developments
- Offer multi-state rate comparisons and historical data analysis

---

## 🏗️ TECHNICAL ARCHITECTURE

### Framework & Core Technologies
- **Frontend**: Next.js 15.4.6 (React, TypeScript)
- **Authentication**: KindeAuth integration
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Payments**: Stripe integration
- **Email**: Brevo for email verification and alerts
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: ECharts, Chart.js
- **UI Components**: Custom components with shadcn/ui patterns
- **Notifications**: React Hot Toast for user notifications
- **Storage**: Vercel Blob Storage for documents and filter options
- **Development Tools**: ESLint, TypeScript strict mode

### Project Structure
```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   ├── components/               # Shared components
│   ├── (pages)/                  # Page components
│   └── globals.css               # Global styles
├── context/                      # React Context providers
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
└── types/                        # TypeScript definitions
```

---

## 🔐 AUTHENTICATION & ACCESS CONTROL

### Authentication System
- **Provider**: KindeAuth (OAuth-based)
- **Session Management**: Server-side sessions
- **User Sync**: Automatic Kinde ↔ Supabase synchronization

### Access Control Levels

#### 🔓 Public Pages (No authentication required)
- `/` - Home page
- `/aboutus` - About Us
- `/contactus` - Contact Us
- `/oursolution` - Our Solution
- `/ourcustomers` - Our Customers
- `/subscribe` - Subscription page

#### 🔒 Basic Authentication Required
- `/profile` - User profile management
- `/settings` - Account settings

#### 💎 Premium Subscription Required (`useRequireSubscription`)
- `/dashboard` - Main dashboard
- `/historical-rates` - Historical rate data
- `/rate-developments` - Rate development tracking
- `/rate-developments/email-alerts` - Email alert configuration
- `/state-rate-comparison/all` - All states comparison
- `/state-rate-comparison/individual` - Individual state comparison
- `/subscription` - Subscription management
- `/email-preferences` - Email alert preferences

#### 👑 Admin Only
- `/admin-dashboard` - Admin control panel
- `/admin-dashboard/rate-developments` - Rate data management
- `/admin-dashboard/rate-developments/edit` - Edit rate developments
- `/admin-dashboard/rate-developments/update-database` - Database update tools
- `/admin-dashboard/rate-developments/send-email-alerts` - Send email alerts
- `/admin-dashboard/marketing-emails` - Marketing email management

### Authentication Flow

The authentication system checks user access in the following order:

1. **Step 1**: Check Stripe subscription for logging-in user
2. **Step 2**: Check if user is a sub-user
   - If sub-user found, check PRIMARY user's:
     - Stripe subscription
     - Wire transfer subscription
3. **Step 3**: Check if logging-in user is a wire transfer user

### Centralized Authentication System
- **Context**: `AuthContext` provides global auth state
- **Hooks**: 
  - `useAuth()` - Basic auth access
  - `useRequireAuth()` - Redirects unauthenticated users
  - `useRequireSubscription()` - Enforces premium access
  - `useProtectedPage()` - Generic protection

---

## 🗄️ DATABASE SCHEMA

### Primary Tables

#### User Table (`User`)
```sql
UserID             INT PRIMARY KEY AUTO_INCREMENT
Email              VARCHAR UNIQUE
FirstName          VARCHAR
LastName           VARCHAR
Picture            VARCHAR
KindeUserID        VARCHAR UNIQUE
CreatedOn          TIMESTAMP
Role               VARCHAR DEFAULT 'user'
SubscriptionStatus VARCHAR
PrimaryUserID      INT (self-reference)
PlanID             INT
CreatedAt          TIMESTAMP DEFAULT NOW()
UpdatedAt          TIMESTAMP
FailedSignIns      INT DEFAULT 0
FullName           VARCHAR
IsSuspended        BOOLEAN DEFAULT false
LastSignedIn       TIMESTAMP
TotalSignIns       INT DEFAULT 0
```

#### subscription_users Table (Sub-user management)
```sql
primary_user       VARCHAR (email)
sub_users          JSONB (array of email addresses)
```

#### Content Tables
- `provider_alerts` - Rate development data (4 service line columns: `service_lines_impacted`, `service_lines_impacted_1`, `service_lines_impacted_2`, `service_lines_impacted_3`)
- `state_plan_amendments` - SPA/Waiver Amendments (4 service line columns: same as provider_alerts)
- `bill_track_50` - Legislative updates
- `service_category_list` - Service categories
- `user_email_preferences` - Email alert preferences
- `admin_logs` - System logs
- `email_verifications` - Email verification records
- `excel_export_usage` - Excel export row limit tracking
- `wire_transfer_subscriptions` - Wire transfer subscription records

### ⚠️ CRITICAL DATABASE NOTES
- **Column Names**: ALL database columns use **PascalCase** (e.g., `FirstName`, `Email`, `UserID`)
- **Row Level Security (RLS)**: Enabled on most tables
- **Service Role Required**: Some operations need Supabase service role to bypass RLS

---

## 🎯 KEY FEATURES & FUNCTIONALITY

### 1. User Management
- ✅ KindeAuth integration with automatic user sync
- ✅ Sub-user system (primary users can add sub-users)
- ✅ Profile management with image upload
- ✅ Email verification system

### 2. Subscription System
- ✅ Stripe integration for payments
- ✅ Professional Plan: $750/month or $8,100/year (10% discount)
- ✅ Wire transfer subscriptions supported
- ✅ Sub-user slot management:
  - **Regular users**: 2 sub-user slots maximum (regardless of plan)
  - **Admin users**: Unlimited slots (checked via `admin_users` table)
- ✅ Sub-user management via settings

### 3. Rate Data & Analytics
- ✅ Historical rate tracking
- ✅ Multi-state comparisons
- ✅ Interactive charts and visualizations
- ✅ Downloadable reports
- ✅ Excel export with 20,000 row limit per subscription (monthly reset)

### 4. Email Alert System
- ✅ Customizable state and category preferences
- ✅ Real-time notifications for rate changes
- ✅ Brevo integration for delivery
- ✅ Supports Provider Alerts, Legislative Updates, and SPA/Waiver Amendments

### 5. Admin Features
- ✅ Rate data management
- ✅ User administration
- ✅ Marketing email campaigns
- ✅ System monitoring and logs
- ✅ Database updates from Azure Blob Storage Excel files

### 6. Document Library
- ✅ Vercel Blob Storage for document management
- ✅ Hierarchical structure: States → Subfolders (ABA, BH, BILLING_MANUALS, IDD, HCBS) → Documents
- ✅ Archive folders (hidden from website but accessible via direct URLs)
- ✅ Search and filter functionality

---

## 🔧 DEVELOPMENT SETUP

### Environment Variables Required
```env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE=...
KINDE_CLIENT_ID=...
KINDE_CLIENT_SECRET=...
KINDE_ISSUER_URL=...
KINDE_SITE_URL=...
KINDE_POST_LOGOUT_REDIRECT_URL=...
KINDE_POST_LOGIN_REDIRECT_URL=...
STRIPE_SECRET_KEY=sk_live_... # Live Stripe secret key only
STRIPE_PUBLISHABLE_KEY=pk_live_... # Live Stripe publishable key only
STRIPE_WEBHOOK_SECRET=whsec_... # Live Stripe webhook secret
BREVO_API_KEY=...
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
AZURE_CONNECTION_STRING=...
CONTAINER_NAME=...
```

### Development Commands
```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server
pnpm build            # Production build (includes Prisma generate)
pnpm lint             # Lint code
```

### Key Development Notes
- **Development Mode**: Right-click protection disabled in dev, DebugMode component enabled
- **Database Access**: Use service role for server-side operations
- **Authentication**: Centralized through AuthContext
- **Styling**: Tailwind with custom theme colors
- **Package Manager**: Use `pnpm` instead of `npm` for Next.js applications

---

## 📊 DATABASE UPDATE PROCESS

### Overview
The database update process downloads Excel files from Azure Blob Storage, parses them, and updates/inserts data into Supabase tables. There are two main types of updates:

1. **BillTrack Update** (`?type=billtrack`) - Updates `bill_track_50` table
2. **Provider Alerts Update** (`?type=provider_alerts`) - Updates `provider_alerts` table
3. **State Plan Amendments Update** (`?type=state_plan_amendments`) - Updates `state_plan_amendments` table

### Process Flow

#### Phase 1: Connection & Download
1. Connect to Azure Blob Storage using `AZURE_CONNECTION_STRING`
2. Download Excel file:
   - BillTrack: `"Medicaid Rates bill sheet with categories.xlsx"`
   - Provider Alerts: `"provideralerts_data.xlsx"`
   - State Plan Amendments: `"state_plan_amendments.xlsx"`

#### Phase 2: Excel Parsing
1. Parse Excel workbook
2. Find appropriate sheet (latest MMDDYY format for BillTrack, specific sheet names for others)
3. Map Excel columns to database columns
4. Handle multiple service line columns (up to 4 columns for provider alerts and SPAs)

#### Phase 3: Database Operations
1. Reset `is_new` flags to 'no' for all entries
2. Fetch existing records from database
3. Compare Excel data with database data
4. Insert new entries with `is_new = 'yes'`
5. Update changed entries (BillTrack only, not Provider Alerts or SPAs)

### Service Line Columns
- Provider Alerts and State Plan Amendments support 4 service line columns:
  - `service_lines_impacted` (primary)
  - `service_lines_impacted_1` (secondary)
  - `service_lines_impacted_2` (tertiary)
  - `service_lines_impacted_3` (quaternary)

---

## 📧 EMAIL ALERT SYSTEM

### Email Detection
- Fetches entries with `is_new = 'yes'` from:
  - `provider_alerts`
  - `bill_track_50`
  - `state_plan_amendments`
- Processes service lines from all 4 columns for provider alerts and SPAs
- Matches users based on:
  - State preferences
  - Service line/category preferences

### Email Generation
- Groups alerts by type (bills, provider_alerts, state_plan_amendment)
- Generates category sections only if alerts exist
- Uses `link` field for SPAs, `url` field for others
- Formats dates correctly

---

## 📁 DOCUMENT LIBRARY SYSTEM

### Storage
- **Service**: Vercel Blob Storage
- **Structure**: `STATE_NAME/SUBFOLDER/FILENAME.EXTENSION`
- **Common Subfolders**: ABA, BH, BILLING_MANUALS, IDD, HCBS
- **Archive Folders**: Folders ending with `_ARCHIVE` are hidden from website but accessible via direct URLs

### Folder Structure
```
ALABAMA/
├── ABA/
│   └── [PDF files]
├── ABA_ARCHIVE/          # Hidden from website
│   └── [Archived files]
├── BH/
│   └── [PDF files]
└── BH_ARCHIVE/           # Hidden from website
    └── [Archived files]
```

### API Endpoints
- `GET /api/documents` - List all documents
- `GET /api/documents/structure` - Get folder structure
- `GET /api/documents/download` - Download a document
- `POST /api/documents/upload` - Upload documents (admin only)
- `POST /api/documents/create-archives` - Create archive folders (admin only)

---

## 🔄 API ENDPOINTS

### Authentication
- `POST /api/sync-kinde-user` - Sync Kinde user to database
- `GET /api/auth-check` - Validate session
- `GET /api/subscription-users` - Check sub-user status
- `GET /api/check-email-access` - Check email access (Stripe, wire transfer, sub-user)

### User Management
- `GET /api/user/profile` - Get user profile (bypasses RLS)
- `PUT /api/user/profile` - Update user profile (bypasses RLS)
- `GET /api/user/email-preferences` - Get email preferences
- `PUT /api/user/email-preferences` - Update email preferences

### Data & Content
- `GET /api/registrationform` - Get form data
- `POST /api/registrationform` - Save/update form data
- `GET /api/filter-options` - Get filter options (from Vercel Blob Storage)
- `GET /api/service-categories` - Get service categories
- `GET /api/code-definations` - Get code definitions with batch processing
- `GET /api/state-payment-comparison` - State payment comparison data
- `GET /api/rate-updates` - Rate update notifications
- `GET /api/legislative-updates` - Legislative update data
- `GET /api/documents` - List documents
- `GET /api/enhanced-metrics` - Enhanced metrics data

### Payments & Subscriptions
- `POST /api/stripe/subscription` - Check subscription status
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/add-slot` - Add subscription slots
- `GET /api/subscription-users` - Get sub-user data
- `POST /api/add-sub-user` - Add sub-user to subscription
- `GET /api/wire-transfer-subscriptions` - Get wire transfer subscriptions

### Email & Verification
- `POST /api/email-verification/request` - Request verification code
- `POST /api/email-verification/verify` - Verify code
- `POST /api/send-email` - Send emails

### Admin APIs
- `GET /api/admin/check-access` - Check admin access permissions
- `POST /api/admin/email-analytics` - Email campaign analytics
- `GET /api/admin/marketing-emails/list` - Get marketing email campaigns
- `POST /api/admin/marketing-emails/send` - Send marketing emails
- `POST /api/admin/send-email-alerts` - Send system email alerts
- `GET /api/admin/rate-data` - Rate data management
- `POST /api/admin/update-database` - Update database records
- `GET /api/admin/user-management` - User management operations
- `GET /api/excel-export/check-usage` - Check Excel export usage
- `POST /api/excel-export/check-usage` - Reserve rows for Excel export

---

## 🚨 KNOWN ISSUES & FIXES

### Database Column Names
- ✅ **Fixed**: All queries now use PascalCase (`FirstName`, `Email`) instead of camelCase
- ✅ **Status**: Profile page, Navbar, and sync-kinde-user API all updated

### Authentication Flow
- ✅ **Fixed**: Centralized AuthContext with custom hooks
- ✅ **Fixed**: Sub-users of wire transfer users can now log in (checks primary user's wire transfer subscription)

### Row Level Security
- ✅ **Fixed**: Server-side API routes with service role for RLS bypass
- ✅ **Status**: `/api/user/profile` API created for profile operations

### Subscription Page Loading
- ✅ **Fixed**: Sub-users no longer stuck in infinite loading state
- ✅ **Status**: Sub-users see subscription info immediately

### Sub-User Subscription Display
- ✅ **Fixed**: Sub-users now display primary user's subscription details
- ✅ **Status**: Shows "Primary Account Subscription" with clear sub-user indicators

### Subscribe Page Click Issues
- ✅ **Fixed**: React Hot Toast toaster no longer blocks clicks
- ✅ **Status**: Subscribe page fully interactive

### Right-Click Protection System
- ✅ **Fixed**: Disabled RightClickProtection component in development
- ✅ **Status**: Pages fully interactive while maintaining debugging capabilities

---

## 🎨 UI/UX DESIGN SYSTEM

### Color Scheme
- **Primary**: `#012C61` (Deep Blue)
- **Secondary**: Blue variants
- **Background**: White/Gray gradients
- **Text**: Gray scale

### Typography
- **Primary Font**: Lemon Milk (brand font)
- **System Font**: System font stack fallback

### Component Patterns
- Consistent button styles with hover effects
- Card-based layouts for content sections
- Responsive grid systems
- Loading states and error boundaries

---

## 📝 MAINTENANCE TASKS

### Regular Updates Needed
1. Update this documentation when making changes
2. Monitor Supabase RLS policies
3. Update database schema introspection
4. Test authentication flows
5. Verify email delivery systems
6. Monitor Stripe webhook handling
7. Regenerate enhanced metrics file when data changes

### Development Best Practices
- Always test authentication flows after changes
- Use TypeScript for type safety
- Follow the established component patterns
- Update tests when adding new features
- Keep environment variables secure
- Use `pnpm` instead of `npm` for Next.js applications

---

## 🛠️ UTILITY SCRIPTS

The following scripts are available in the `scripts/` folder:

- `verify-and-sync-all-states.ts` - Comprehensive verification and synchronization of all local document library files with Vercel Blob storage
- `create-south-dakota-folders.ts` - Create folder structure for South Dakota (can be adapted for other states)
- `compare-local-vs-blob.ts` - Compare local Document Library with Vercel Blob storage
- `merge-local-and-blob.ts` - Merge local Document Library with Vercel Blob storage

---

## 📞 SUPPORT & CONTACT

### Key Integrations
- **Database**: Supabase PostgreSQL
- **Auth**: KindeAuth
- **Payments**: Stripe
- **Email**: Brevo
- **Storage**: Vercel Blob Storage
- **Hosting**: Vercel (implied)

---

**Last Updated**: January 2025
**Version**: 2.0.1
**Maintainer**: Development Team

---

*This document should be updated whenever significant changes are made to the application architecture, database schema, or core functionality.*
