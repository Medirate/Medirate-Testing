# MediRate - Project Documentation

---

## 🤖 **FOR AI ASSISTANTS - READ THIS FIRST**

**If you are an AI assistant helping with this project, please read this entire document before making any code changes or suggestions.**

### **📖 Critical Instructions:**
1. **ALWAYS** read this documentation completely before starting work
2. **NEVER** assume database column names - they are ALL PascalCase (e.g., `Email`, `FirstName`, `UserID`)
3. **ALWAYS** use the centralized authentication system (`useAuth`, `useRequireAuth`, `useRequireSubscription`)
4. **NEVER** create new authentication logic - use existing hooks
5. **ALWAYS** update this documentation when making significant changes
6. **REFER** to the "Known Issues & Fixes" section for common problems
7. **ASK** clarifying questions about database setup if unsure [[memory:6794331]]
8. **USE** Lucide icons only [[memory:6794371]]
9. **AVOID** emojis in code/output [[memory:6794349]]
10. **RESPECT** dark mode preference [[memory:6794360]]

### **🚨 Common Mistakes to Avoid:**
- ❌ Using camelCase database columns (`firstName` ❌) - Use PascalCase (`FirstName` ✅)
- ❌ Creating new auth logic - Use existing centralized system
- ❌ Assuming database structure - Check this documentation first
- ❌ Ignoring Row Level Security (RLS) - Use service role APIs when needed
- ❌ Breaking existing functionality - Test authentication flows

### **✅ Quick Start Checklist:**
- [ ] Read this documentation completely
- [ ] Understand the database schema (all PascalCase columns)
- [ ] Know the authentication system (centralized with hooks)
- [ ] Check current known issues before debugging
- [ ] Update this file when making changes

---

## 📋 **PROJECT OVERVIEW**

**MediRate** is a comprehensive Medicaid rate tracking and analysis platform that provides healthcare organizations with real-time access to payment rate data, legislative updates, and customizable email alerts across all 50 states and the District of Columbia.

### **Core Purpose**
- Track Medicaid provider payment rates across states
- Monitor legislative changes affecting reimbursement
- Provide customizable email alerts for rate developments
- Offer multi-state rate comparisons and historical data analysis

---

## 🏗️ **TECHNICAL ARCHITECTURE**

### **Framework & Core Technologies**
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
- **Storage**: Vercel Blob Storage for filter options data
- **Development Tools**: ESLint, TypeScript strict mode

### **Project Structure**
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

## 🔐 **AUTHENTICATION & ACCESS CONTROL**

### **Authentication System**
- **Provider**: KindeAuth (OAuth-based)
- **Session Management**: Server-side sessions
- **User Sync**: Automatic Kinde ↔ Supabase synchronization

### **Access Control Levels**

#### **🔓 Public Pages** (No authentication required)
- `/` - Home page
- `/aboutus` - About Us
- `/contactus` - Contact Us
- `/oursolution` - Our Solution
- `/ourcustomers` - Our Customers
- `/subscribe` - Subscription page

#### **🔒 Basic Authentication Required**
- `/profile` - User profile management
- `/settings` - Account settings

#### **💎 Premium Subscription Required** (`useRequireSubscription`)
- `/dashboard` - Main dashboard
- `/historical-rates` - Historical rate data
- `/rate-developments` - Rate development tracking
- `/rate-developments/email-alerts` - Email alert configuration
- `/state-rate-comparison/all` - All states comparison
- `/state-rate-comparison/individual` - Individual state comparison
- `/subscription` - Subscription management
- `/email-preferences` - Email alert preferences

#### **👑 Admin Only**
- `/admin-dashboard` - Admin control panel
- `/admin-dashboard/rate-developments` - Rate data management (view only)
- `/admin-dashboard/rate-developments/edit` - Edit rate developments
- `/admin-dashboard/rate-developments/update-database` - Database update tools
- `/admin-dashboard/rate-developments/send-email-alerts` - Send email alerts
- `/admin-dashboard/marketing-emails` - Marketing email management

### **Centralized Authentication System**
- **Context**: `AuthContext` provides global auth state
- **Hooks**: 
  - `useAuth()` - Basic auth access
  - `useRequireAuth()` - Redirects unauthenticated users
  - `useRequireSubscription()` - Enforces premium access
  - `useProtectedPage()` - Generic protection

---

## 🗄️ **DATABASE SCHEMA**

### **Primary Tables**

#### **User Table** (`User`)
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

#### **subscription_users Table** (Sub-user management)
```sql
primary_user       VARCHAR (email)
sub_users          JSONB (array of email addresses)
```

#### **registrationform Table**
```sql
id                 INT PRIMARY KEY
email              VARCHAR
firstname          VARCHAR
lastname           VARCHAR
companyname        VARCHAR
companytype        VARCHAR
providertype       VARCHAR
howdidyouhear      VARCHAR
interest           TEXT
demorequest        VARCHAR
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

#### **Payment & Subscription Tables**
- `Plan` - Subscription plans
- `Payment` - Payment records
- `Subscription` - Active subscriptions

#### **Content Tables**
- `provider_alerts` - Rate development data
- `service_category_list` - Service categories
- `user_email_preferences` - Email alert preferences
- `admin_logs` - System logs
- `email_verifications` - Email verification records

### **⚠️ CRITICAL DATABASE NOTES**
- **Column Names**: ALL database columns use **PascalCase** (e.g., `FirstName`, `Email`, `UserID`)
- **Row Level Security (RLS)**: Enabled on most tables
- **Service Role Required**: Some operations need Supabase service role to bypass RLS

---

## 🎯 **KEY FEATURES & FUNCTIONALITY**

### **1. User Management**
- ✅ KindeAuth integration with automatic user sync
- ✅ Sub-user system (primary users can add sub-users)
- ✅ Profile management with image upload
- ✅ Email verification system

### **2. Subscription System**
- ✅ Stripe integration for payments
- ✅ Professional Plan: $750/month or $8,100/year (10% discount)
- ✅ Sub-user slot management:
  - **Regular users**: 2 sub-user slots maximum (regardless of plan)
  - **Admin users**: Unlimited slots (checked via `admin_users` table)
- ✅ Sub-user management via settings

### **3. Rate Data & Analytics**
- ✅ Historical rate tracking
- ✅ Multi-state comparisons
- ✅ Interactive charts and visualizations
- ✅ Downloadable reports

### **4. Email Alert System**
- ✅ Customizable state and category preferences
- ✅ Real-time notifications for rate changes
- ✅ Brevo integration for delivery

### **5. Admin Features**
- ✅ Rate data management
- ✅ User administration
- ✅ Marketing email campaigns
- ✅ System monitoring and logs

---

## 🔧 **DEVELOPMENT SETUP**

### **Environment Variables Required**
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
```

### **Development Commands**
```bash
npm run dev          # Start development server
npx prisma db pull   # Sync database schema
npx prisma generate  # Generate Prisma client
npm run build        # Production build
npm run lint         # Lint code
```

### **Key Development Notes**
- **Development Mode**: Right-click protection disabled in dev, DebugMode component enabled
- **Database Access**: Use service role for server-side operations
- **Authentication**: Centralized through AuthContext
- **Styling**: Tailwind with custom theme colors
- **Click Interactions**: React Hot Toast toaster overlay fixed for proper page interactions
- **Virtual Environment**: User prefers Python codes to run within their own virtual environment [[memory:user_rules]]
- **Data Storage**: Filter options served from Vercel Blob Storage for performance
- **Batch Processing**: Code definitions API uses batch processing for large datasets

---

## 🚨 **KNOWN ISSUES & FIXES**

### **Database Column Names**
- ❌ **Problem**: Original code used camelCase (`firstName`, `email`)
- ✅ **Fix**: All queries now use PascalCase (`FirstName`, `Email`) - COMPLETED
- ✅ **Status**: Profile page, Navbar, and sync-kinde-user API all updated

### **Authentication Flow**
- ❌ **Problem**: Scattered auth logic across components
- ✅ **Fix**: Centralized AuthContext with custom hooks

### **Row Level Security**
- ❌ **Problem**: Client queries blocked by RLS
- ✅ **Fix**: Server-side API routes with service role - IMPLEMENTED
- ✅ **Status**: `/api/user/profile` API created for profile operations
- ✅ **Status**: `/api/registrationform` API created for form operations

### **Subscription Page Loading**
- ❌ **Problem**: Sub-users stuck in infinite loading state
- ✅ **Fix**: Added missing `setLoading(false)` for sub-users and `fetchSubscriptionData` function
- ✅ **Status**: Sub-users now see subscription info immediately

### **Sub-User Subscription Display**
- ❌ **Problem**: Sub-users see "No active subscription found" instead of primary user's subscription
- ✅ **Fix**: Sub-users now fetch and display primary user's subscription details
- ✅ **Status**: Shows "Primary Account Subscription" with clear sub-user indicators

### **Sub-User Management**
- ❌ **Problem**: Primary users couldn't edit/change sub-user email addresses in existing slots
- ✅ **Fix**: Added inline editing with Edit/Remove buttons for each sub-user
- ✅ **Status**: Primary users can now edit, remove, and manage sub-user slots

### **Subscribe Page Click Issues**
- ❌ **Problem**: React Hot Toast toaster element blocking all clicks on subscribe page
- ✅ **Fix**: Added CSS overrides and JavaScript fixes to disable toaster container pointer events
- ✅ **Status**: Subscribe page fully interactive, toaster notifications still functional
- ✅ **Technical Details**: 
  - Toaster element (#_rht_toaster) covers entire viewport with position:fixed
  - CSS override: `pointer-events: none !important` and `z-index: -1 !important`
  - JavaScript force-fix applied on page load

### **Right-Click Protection System**
- ❌ **Problem**: Right-click protection interfering with normal page interactions
- ✅ **Fix**: Disabled RightClickProtection component and removed no-right-click class from body
- ✅ **Status**: Pages fully interactive while maintaining development debugging capabilities

### **Email Verification**
- ✅ **Working**: Brevo integration for verification codes
- ✅ **Working**: IP throttling and rate limiting

---

## 📊 **USER JOURNEY & WORKFLOWS**

### **New User Registration**
1. User visits `/subscribe`
2. Email verification (if not authenticated)
3. Complete registration form
4. KindeAuth account creation
5. Stripe payment processing
6. Access to premium features

### **Sub-User Management**
1. Primary user logs in
2. Go to `/subscription` page
3. Add sub-user emails
4. Sub-users receive invitation
5. Sub-users get full premium access

### **Admin Workflow**
1. Admin authentication check
2. Access to admin dashboard
3. Manage rate data, users, emails
4. Monitor system through logs

---

## 🔄 **API ENDPOINTS**

### **Authentication**
- `POST /api/sync-kinde-user` - Sync Kinde user to database
- `GET /api/auth-check` - Validate session
- `GET /api/subscription-users` - Check sub-user status

### **User Management**
- `GET /api/user/profile` - Get user profile (bypasses RLS)
- `PUT /api/user/profile` - Update user profile (bypasses RLS)
- `GET /api/user/email-preferences` - Get email preferences
- `PUT /api/user/email-preferences` - Update email preferences

### **Data & Content**
- `GET /api/registrationform` - Get form data
- `POST /api/registrationform` - Save/update form data
- `GET /api/filter-options` - Get filter options (from Vercel Blob Storage)
- `GET /api/service-categories` - Get service categories
- `GET /api/code-definations` - Get code definitions with batch processing
- `GET /api/state-payment-comparison` - State payment comparison data
- `GET /api/rate-updates` - Rate update notifications
- `GET /api/legislative-updates` - Legislative update data

### **Payments & Subscriptions**
- `POST /api/stripe/subscription` - Check subscription status
- `POST /api/stripe/create-checkout-session` - Create payment session
- `POST /api/stripe/add-slot` - Add subscription slots
- `POST /api/stripe/add-slots` - Add multiple subscription slots
- `GET /api/subscription-users` - Get sub-user data
- `POST /api/add-sub-user` - Add sub-user to subscription

### **Email & Verification**
- `POST /api/email-verification/request` - Request verification code
- `POST /api/email-verification/verify` - Verify code
- `POST /api/send-email` - Send emails

### **Admin APIs**
- `GET /api/admin/check-access` - Check admin access permissions
- `POST /api/admin/email-analytics` - Email campaign analytics
- `GET /api/admin/marketing-emails/list` - Get marketing email campaigns
- `POST /api/admin/marketing-emails/send` - Send marketing emails
- `GET /api/admin/marketing-emails/bounced` - Get bounced email analytics
- `POST /api/admin/send-email-alerts` - Send system email alerts
- `GET /api/admin/rate-data` - Rate data management
- `POST /api/admin/update-database` - Update database records
- `GET /api/admin/user-management` - User management operations
- `GET /api/admin/service-categories` - Admin service category management
- `POST /api/admin/service-categories` - Create/update service categories

---

## 🎨 **UI/UX DESIGN SYSTEM**

### **Color Scheme**
- **Primary**: `#012C61` (Deep Blue)
- **Secondary**: Blue variants
- **Background**: White/Gray gradients
- **Text**: Gray scale

### **Typography**
- **Primary Font**: Lemon Milk (brand font)
- **System Font**: System font stack fallback

### **Component Patterns**
- Consistent button styles with hover effects
- Card-based layouts for content sections
- Responsive grid systems
- Loading states and error boundaries

### **User Preferences**
[[memory:6794360]] - User prefers only dark mode in the project
[[memory:6794371]] - Project uses Lucide icons for all UI icons by default
[[memory:6794349]] - User prefers no emojis in output, using design-appropriate style

---

## 📝 **MAINTENANCE TASKS**

### **Regular Updates Needed**
1. Update this documentation when making changes
2. Monitor Supabase RLS policies
3. Update database schema introspection
4. Test authentication flows
5. Verify email delivery systems
6. Monitor Stripe webhook handling

### **Development Best Practices**
- Always test authentication flows after changes
- Use TypeScript for type safety
- Follow the established component patterns
- Update tests when adding new features
- Keep environment variables secure

---

## 📞 **SUPPORT & CONTACT**

### **Key Integrations**
- **Database**: Supabase PostgreSQL
- **Auth**: KindeAuth
- **Payments**: Stripe
- **Email**: Brevo
- **Hosting**: Vercel (implied)

### **Important Notes**
[[memory:6794331]] - User prefers that assistant not assume database setup; ask clarifying questions when unsure

---

**Last Updated**: January 2025 (Subscribe page click fixes, API endpoint additions, React Hot Toast integration)
**Version**: 1.1.0
**Maintainer**: Development Team

---

*This document should be updated whenever significant changes are made to the application architecture, database schema, or core functionality.*
