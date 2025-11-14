# Development vs Production Feature Comparison

## 🔍 Comprehensive Feature Analysis

### ✅ Features in DEV that are NOT in PRODUCTION

---

## 1. **State Plan Amendments (SPA) Support**

### Status: ❌ MISSING IN PRODUCTION

**Development:**
- ✅ Full support for `state_plan_amendments` table
- ✅ Supports 4 service line columns (`service_lines_impacted`, `service_lines_impacted_1`, `service_lines_impacted_2`, `service_lines_impacted_3`)
- ✅ Displayed in `/rate-developments` page
- ✅ Editable in `/admin-dashboard/rate-developments/edit`
- ✅ Included in email alerts processing (`/api/admin/send-email-alerts`)
- ✅ Database update support in `/api/admin/update-database`

**Production:**
- ❌ No `state_plan_amendments` support in rate-developments page
- ❌ No SPA processing in email alerts API
- ⚠️ Only has `service_lines_impacted_3` for `provider_alerts` and `bills`, but NOT for `state_plan_amendments`

**Files Affected:**
- `src/app/rate-developments/page.tsx`
- `src/app/admin-dashboard/rate-developments/edit/page.tsx`
- `src/app/api/admin/send-email-alerts/route.ts`
- `src/app/api/admin/update-database/route.ts`

---

## 2. **Email Template Image URLs**

### Status: ⚠️ OUTDATED IN PRODUCTION

**Development:**
- ✅ Uses new public repository: `https://raw.githubusercontent.com/Medirate/Medirate-Public/main/`
- ✅ All email templates updated

**Production:**
- ❌ Still uses old repository: `https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/`
- ❌ Images may not load correctly (repo is private)

**Files Affected:**
- `public/welcome-email-template.html`
- `public/user-added-email-template.html`
- `public/user-added-primary-email-template.html`
- `public/user-removed-email-template.html`
- `public/invoice-email-template.html`
- `public/first-login-welcome-template.html`

---

## 3. **Send Email Alerts Page Enhancement**

### Status: ❌ MISSING IN PRODUCTION

**Development:**
- ✅ Enhanced UI with professional button styling (no emojis)
- ✅ Email preview functionality
- ✅ Test email list management (add, edit, delete test emails)
- ✅ Three modes: Preview, Test Users, All Users
- ✅ Better logging and status display
- ✅ User-friendly interface

**Production:**
- ❌ Basic version with single "Send Email Notifications" button
- ❌ No preview functionality
- ❌ No test email list management
- ❌ Simple emoji-based button

**Files Affected:**
- `src/app/admin-dashboard/rate-developments/send-email-alerts/page.tsx`

---

## 4. **Documents Page UI Enhancement**

### Status: ❌ MISSING IN PRODUCTION

**Development:**
- ✅ Enhanced professional UI with better styling
- ✅ Improved card-based layout
- ✅ Better visual hierarchy
- ✅ Enhanced user experience

**Production:**
- ❌ Basic version with simpler UI
- ❌ Less polished design

**Files Affected:**
- `src/app/documents/page.tsx`

---

## 5. **Dashboard Export Functionality**

### Status: ❌ MISSING IN PRODUCTION

**Development:**
- ✅ CSV export functionality (currently disabled/hidden)
- ✅ Excel export functionality
- ✅ Export usage tracking
- ✅ Export confirmation modals
- ✅ Row limit management

**Production:**
- ❌ No export functionality at all
- ❌ No export-related code

**Files Affected:**
- `src/app/dashboard/page.tsx`
- `src/app/api/excel-export/check-usage/route.ts` (may not exist in production)

---

## 6. **Admin Dashboard - Document Management Tools**

### Status: ❌ MISSING IN PRODUCTION

**Development:**
- ✅ `/admin-dashboard/documents/fix-washington-ada` page
- ✅ API endpoint `/api/documents/fix-washington-ada` for fixing folder names in Vercel Blob
- ✅ Tool to correct Washington ADA → ABA folder naming issue

**Production:**
- ❌ No document management tools in admin dashboard
- ❌ No fix-washington-ada functionality

**Files Affected:**
- `src/app/admin-dashboard/documents/fix-washington-ada/page.tsx`
- `src/app/api/documents/fix-washington-ada/route.ts`

---

## 7. **Email Alerts API - State Plan Amendments Processing**

### Status: ❌ MISSING IN PRODUCTION

**Development:**
- ✅ Processes `state_plan_amendments` table
- ✅ Supports 4 service line columns for SPA
- ✅ Includes SPA in email matching logic
- ✅ Sends emails for matching SPA entries

**Production:**
- ❌ Does NOT process `state_plan_amendments`
- ❌ Only processes `provider_alerts` and `bills`
- ❌ Missing SPA email alert functionality

**Files Affected:**
- `src/app/api/admin/send-email-alerts/route.ts`

---

## 8. **Database Update - State Plan Amendments Support**

### Status: ⚠️ PARTIAL IN PRODUCTION

**Development:**
- ✅ Full support for updating `state_plan_amendments` from Excel
- ✅ Supports all 4 service line columns
- ✅ Proper mapping and validation

**Production:**
- ⚠️ May have partial support, but needs verification
- ⚠️ May not support `service_lines_impacted_3` for SPA

**Files Affected:**
- `src/app/api/admin/update-database/route.ts`

---

## 🔐 Authentication Comparison

### Status: ✅ SAME IN BOTH

Both Development and Production use:
- ✅ **KindeAuth** for authentication
- ✅ Same authentication flow
- ✅ Same admin authentication system (`validateAdminAuth`)
- ✅ Same user role management
- ✅ Same subscription checking logic
- ✅ Same protected route system

**No authentication differences found.**

---

## 📊 Summary Statistics

| Feature Category | DEV | PROD | Status |
|-----------------|-----|------|--------|
| State Plan Amendments Support | ✅ | ❌ | **MISSING** |
| Email Template URLs | ✅ Updated | ❌ Old URLs | **OUTDATED** |
| Send Email Alerts UI | ✅ Enhanced | ❌ Basic | **MISSING** |
| Documents Page UI | ✅ Enhanced | ❌ Basic | **MISSING** |
| Dashboard Export | ✅ (Disabled) | ❌ None | **MISSING** |
| Admin Document Tools | ✅ | ❌ | **MISSING** |
| SPA Email Alerts | ✅ | ❌ | **MISSING** |
| Authentication | ✅ | ✅ | **SAME** |

---

## 🚀 Recommended Migration Priority

### **HIGH PRIORITY** (Critical Features)
1. **State Plan Amendments Support** - Core functionality missing
2. **Email Template URLs** - Images won't load in production
3. **Email Alerts API - SPA Processing** - Users not receiving SPA alerts

### **MEDIUM PRIORITY** (User Experience)
4. **Send Email Alerts Page Enhancement** - Better admin experience
5. **Documents Page UI** - Better user experience

### **LOW PRIORITY** (Nice to Have)
6. **Admin Document Management Tools** - Utility feature
7. **Dashboard Export** - Currently disabled anyway

---

## 9. **Utility Scripts**

### Status: ❌ DIFFERENT IN PRODUCTION

**Development:**
- ✅ `scripts/compare-local-vs-blob.ts` - Compare local vs Vercel Blob storage
- ✅ `scripts/create-south-dakota-folders.ts` - Create folder structure for South Dakota
- ✅ `scripts/merge-local-and-blob.ts` - Merge local and blob storage
- ✅ `scripts/verify-and-sync-all-states.ts` - Verify and sync all states

**Production:**
- ✅ `scripts/compare-bt50-vs-db.js` - Compare billtrack50 vs database
- ✅ `scripts/generate-enhanced-metrics.js` - Generate enhanced metrics
- ❌ No document library sync scripts

**Note:** These are utility scripts and don't affect application functionality.

---

## 10. **Documentation**

### Status: ⚠️ DIFFERENT IN PRODUCTION

**Development:**
- ✅ Comprehensive `README.md` with full project documentation
- ✅ Consolidated documentation from multiple files
- ✅ Up-to-date feature descriptions

**Production:**
- ❌ README.md appears to be Supabase CLI documentation (not project-specific)
- ❌ Multiple separate documentation files (not consolidated)

---

## 📝 Notes

- All authentication systems are identical between dev and production
- Production appears to be missing significant functionality around State Plan Amendments
- Email template image URLs in production need immediate update (broken links)
- Development has more polished UI/UX in several areas
- Export functionality exists in dev but is currently disabled
- Development has better documentation structure
- Utility scripts differ but don't affect core functionality

---

**Generated:** January 2025
**Comparison Date:** January 2025

