# Archive Folders Guide - Vercel Blob Storage

## Overview

Archive folders are special folders in Vercel Blob storage that are **hidden from the website** but remain accessible directly via Vercel Blob URLs. They are used to store older or archived documents while keeping the main folders clean and organized.

## Folder Structure

For each main folder, create a corresponding archive folder with the `_ARCHIVE` suffix:

### Example Structure:

```
ALABAMA/
├── ABA/                          ← Main folder (visible on website)
│   ├── file1.pdf
│   └── file2.pdf
├── ABA_ARCHIVE/                  ← Archive folder (hidden from website)
│   ├── old_file1.pdf
│   └── old_file2.pdf
├── BH/                           ← Main folder (visible on website)
│   └── current_file.pdf
├── BH_ARCHIVE/                   ← Archive folder (hidden from website)
│   └── archived_file.pdf
├── BILLING_MANUALS/              ← Main folder (visible on website)
│   └── current_manual.pdf
└── BILLING_MANUALS_ARCHIVE/      ← Archive folder (hidden from website)
    └── old_manual.pdf
```

## Archive Folder Naming Convention

**Pattern:** `{FOLDER_NAME}_ARCHIVE`

**Examples:**
- `ABA` → `ABA_ARCHIVE`
- `BH` → `BH_ARCHIVE`
- `BILLING_MANUALS` → `BILLING_MANUALS_ARCHIVE`
- `IDD` → `IDD_ARCHIVE`
- `HCBS` → `HCBS_ARCHIVE`

## Visibility Rules

### ✅ Visible on Website
- Main folders: `ABA/`, `BH/`, `BILLING_MANUALS/`, `IDD/`, `HCBS/`, etc.
- Files in main folders appear in the documents page
- Users can search, filter, and download files from main folders

### ❌ Hidden from Website
- Archive folders: `ABA_ARCHIVE/`, `BH_ARCHIVE/`, etc.
- Files in archive folders do NOT appear on the documents page
- Archive folders are NOT shown in the folder structure on the website
- Archive folders are NOT searchable through the website

### ✅ Still Accessible via Direct URL
- Archive folders remain in Vercel Blob storage
- Files can still be accessed via direct Vercel Blob URLs
- Useful for maintaining historical records without cluttering the main interface

## How It Works

The filtering logic automatically excludes any folder containing `ARCHIVE` or ending with `_ARCHIVE`:

```typescript
// Archive folders are filtered out
const hasArchiveFolder = pathParts.some(part => 
  part.toUpperCase().includes('ARCHIVE') || 
  part.toUpperCase().endsWith('_ARCHIVE')
);
if (hasArchiveFolder) return false; // Excluded from website
```

## Creating Archive Folders

### Via Vercel CLI

```bash
# Upload files to archive folder
vercel blob put ALABAMA/ABA_ARCHIVE/old_file.pdf --token=your_token

# Upload multiple files to archive
vercel blob put ALABAMA/ABA_ARCHIVE/ --token=your_token
```

### Via Vercel Dashboard

1. Go to Vercel Dashboard → Your Project → Storage
2. Navigate to the blob store
3. Upload files to folders ending with `_ARCHIVE`

### Folder Structure in Vercel Blob

When you upload to an archive folder, the pathname should be:
```
STATE_NAME/FOLDER_NAME_ARCHIVE/FILENAME.EXTENSION
```

**Example:**
```
ALABAMA/ABA_ARCHIVE/Alabama ASD Fee Schedule 2020.pdf
```

## Use Cases

### 1. **Old Document Archival**
- Move outdated fee schedules to archive folders
- Keep current documents in main folders
- Maintain historical records without cluttering the interface

### 2. **Version Control**
- Archive previous versions of documents
- Keep only the latest version in main folders
- Access old versions via direct URLs when needed

### 3. **Seasonal Cleanup**
- Archive documents from previous years
- Keep current year documents in main folders
- Reduce visual clutter on the website

### 4. **Compliance & Records**
- Maintain complete historical records
- Keep records accessible but not prominently displayed
- Meet retention requirements without overwhelming users

## Best Practices

1. **Consistent Naming**: Always use `_ARCHIVE` suffix
2. **Organize by State**: Create archive folders under each state
3. **Document Purpose**: Consider adding a README in archive folders explaining their contents
4. **Regular Cleanup**: Periodically move old files to archive folders
5. **Direct Access**: Keep a record of important archive file URLs for direct access

## Accessing Archive Files

### Direct URL Access

Archive files can still be accessed via their direct Vercel Blob URLs:

```
https://[blob-storage-url]/ALABAMA/ABA_ARCHIVE/old_file.pdf
```

### Finding Archive Files

1. **Via Vercel Dashboard**: Navigate to Storage → Blob Store → Find archive folders
2. **Via API** (Admin only): Use `/api/documents/structure` to see all files including archives
3. **Via Vercel CLI**: 
   ```bash
   vercel blob list --token=your_token | grep ARCHIVE
   ```

## Migration Guide

### Moving Files to Archive

1. **Identify files to archive** (old, outdated, or rarely accessed)
2. **Upload to archive folder** using Vercel CLI:
   ```bash
   vercel blob put STATE/FOLDER_ARCHIVE/file.pdf --token=your_token
   ```
3. **Delete from main folder** (optional, to save space):
   ```bash
   vercel blob del STATE/FOLDER/file.pdf --token=your_token
   ```

### Example Migration

**Before:**
```
ALABAMA/ABA/
├── current_schedule_2024.pdf
├── old_schedule_2023.pdf  ← Move to archive
└── old_schedule_2022.pdf  ← Move to archive
```

**After:**
```
ALABAMA/ABA/
└── current_schedule_2024.pdf

ALABAMA/ABA_ARCHIVE/
├── old_schedule_2023.pdf
└── old_schedule_2022.pdf
```

## Technical Details

### Filtering Logic

The system filters out archive folders at multiple levels:

1. **Documents API** (`/api/documents`): Excludes archive folders from document list
2. **Structure API** (`/api/documents/structure`): Excludes archive folders from structure view
3. **Frontend**: Archive folders never appear in the UI

### Archive Detection

A folder is considered an archive if:
- Any part of the pathname contains `ARCHIVE` (case-insensitive)
- Any part of the pathname ends with `_ARCHIVE` (case-insensitive)

**Examples:**
- ✅ `ALABAMA/ABA_ARCHIVE/file.pdf` → Hidden
- ✅ `ALABAMA/ARCHIVE_OLD/file.pdf` → Hidden
- ✅ `ALABAMA/BH/BH_ARCHIVE/file.pdf` → Hidden
- ❌ `ALABAMA/ABA/file.pdf` → Visible

## Summary

- **Archive folders** use `_ARCHIVE` suffix
- **Hidden from website** but remain in Vercel Blob
- **Accessible via direct URLs** when needed
- **Organized by state and folder** (e.g., `ALABAMA/ABA_ARCHIVE/`)
- **Automatic filtering** - no manual configuration needed

