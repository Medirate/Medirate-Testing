# Document Library System - Deep Analysis

## Overview
The Document Library is a comprehensive file management system built on **Vercel Blob Storage** that organizes Medicaid-related documents by state and category. It provides authenticated access to policy documents, billing manuals, and state-specific resources.

---

## Architecture

### Storage Backend
- **Service**: Vercel Blob Storage (`@vercel/blob`)
- **Access Control**: Public access for uploaded files (via `access: 'public'`)
- **Authentication**: Kinde authentication required for all API endpoints

### Folder Structure
```
STATE_NAME/
├── SUBFOLDER/
│   ├── document1.pdf
│   ├── document2.pdf
│   └── ...
├── SUBFOLDER_ARCHIVE/          # Hidden from UI
│   └── archived_document.pdf
└── ...
```

**Common Subfolders:**
- `ABA` - Applied Behavior Analysis
- `BH` - Behavioral Health
- `BILLING_MANUALS` - Billing documentation
- `IDD` - Intellectual and Developmental Disabilities
- `HCBS` - Home and Community-Based Services

**Archive Folders:**
- Folders ending with `_ARCHIVE` are **hidden from the website UI**
- Still accessible via direct URLs in Vercel Blob Storage
- Used for historical/archived documents

**Metadata Folder:**
- `_metadata/` - Contains JSON configuration files
- `_metadata/manual_billing_links.json` - Stores external links per state

---

## API Endpoints

### 1. `GET /api/documents`
**Purpose**: List all documents (excluding archives)

**Authentication**: Required (Kinde)

**Process**:
1. Lists all blobs from Vercel Blob Storage using `list()`
2. Filters out:
   - Files in `_metadata/` folder
   - JSON files
   - Files in folders containing `ARCHIVE` or ending with `_ARCHIVE`
3. Loads external links from `_metadata/manual_billing_links.json`
4. Transforms blob data into Document objects

**Response Structure**:
```typescript
{
  documents: Document[],
  stateLinks: Record<string, Array<string | { title: string; url: string }>>
}
```

**Document Object**:
```typescript
{
  id: string,                    // URL-based ID
  title: string,                 // Filename
  type: string,                   // File extension (e.g., "pdf")
  folder: string,                // Full folder path
  subfolder?: string,            // Subfolder name (e.g., "ABA")
  state?: string,                // Extracted from path
  category: string,              // Subfolder or folder path
  description: string,           // Auto-generated description
  uploadDate: string,            // ISO date string
  lastModified: string,          // Same as uploadDate
  fileSize: string,              // Formatted (e.g., "2.5 MB")
  downloadUrl: string,           // Direct blob URL
  tags: string[],                // [extension, folderPath, subfolder]
  isPublic: boolean,             // Always true
  filePath: string              // Full storage path
}
```

**Key Functions**:
- `extractStateFromPath()`: Extracts state from first path segment
- `formatFileSize()`: Converts bytes to human-readable format
- `getCategoryFromPath()`: Maps path to category type

---

### 2. `GET /api/documents/structure`
**Purpose**: Get hierarchical folder structure with statistics

**Authentication**: Required (Kinde)

**Process**:
1. Lists all blobs
2. Filters out metadata and archive folders (same as `/api/documents`)
3. Builds nested structure: `{ [state]: { [subfolder]: BlobFile[] } }`
4. Calculates statistics per state and subfolder

**Response Structure**:
```typescript
{
  success: boolean,
  structure: FolderStructure,    // Nested state/subfolder/file structure
  metadataFiles: BlobFile[],     // Metadata files info
  stats: {
    totalFiles: number,
    documentFiles: number,
    metadataFiles: number,
    totalSize: number,
    totalSizeMB: string,
    totalSizeGB: string,
    states: number,
    stateBreakdown: Array<{
      state: string,
      fileCount: number,
      subfolderCount: number,
      size: number,
      sizeMB: string,
      subfolders: Array<{
        subfolder: string,
        fileCount: number,
        size: number,
        sizeMB: string,
        files: Array<{
          pathname: string,
          fileName: string,
          size: number,
          sizeKB: string,
          uploadedAt: string
        }>
      }>
    }>
  },
  allFiles: Array<{...}>        // First 100 files (limited)
}
```

**Use Case**: Admin dashboard, storage analytics, folder management

---

### 3. `GET /api/documents/download`
**Purpose**: Proxy download with authentication

**Authentication**: Required (Kinde)

**Query Parameters**:
- `url`: The blob URL to download

**Process**:
1. Validates authentication
2. Fetches file from provided blob URL
3. Returns file as binary with proper headers:
   - `Content-Type`: From original response
   - `Content-Disposition`: `attachment; filename="..."`
   - `Content-Length`: File size

**Why Proxy?**
- Ensures authentication before download
- Allows tracking/logging downloads
- Can add rate limiting or access control

---

### 4. `POST /api/documents/upload`
**Purpose**: Upload documents to blob storage (Admin only)

**Authentication**: Required (Kinde) + Admin email check

**Admin Emails**:
- `dev@metasysconsulting.com`
- `gnersess@medirate.net`

**Request Body**: `FormData`
- `file`: File object
- `folderPath`: Target folder path (e.g., `"ALABAMA/ABA"`)

**Process**:
1. Validates admin access
2. Creates full path: `{folderPath}/{fileName}`
3. Uploads to Vercel Blob using `put()` with `access: 'public'`
4. Returns blob URL and pathname

**Response**:
```typescript
{
  success: true,
  blob: {
    url: string,
    pathname: string
  }
}
```

---

### 5. `POST /api/documents/create-archives`
**Purpose**: Create archive folder structure for all states (Admin only)

**Authentication**: Required (Kinde) + Admin email check

**Process**:
1. Iterates through all 50 states
2. For each state, creates archive folders for each subfolder:
   - `{STATE}/{SUBFOLDER}_ARCHIVE/.gitkeep`
3. Uses placeholder file (`.gitkeep`) since Vercel Blob doesn't support empty folders

**Archive Folders Created**:
- `ALABAMA/ABA_ARCHIVE/`
- `ALABAMA/BH_ARCHIVE/`
- `ALABAMA/BILLING_MANUALS_ARCHIVE/`
- ... (for all states and subfolders)

**Response**:
```typescript
{
  success: true,
  message: string,
  results: {
    total: number,
    success: number,
    failed: number,
    failedPaths: string[]
  }
}
```

---

## Frontend Implementation

### Main Page: `/documents/page.tsx`

**Features**:
1. **Document Listing**: Fetches from `/api/documents`
2. **Search**: Filters by title, description, tags
3. **Category Filter**: Filter by document category
4. **State Filter**: Filter by state
5. **Grouping**: Groups documents by state → subfolder
6. **Expandable Sections**: Collapsible state and subfolder sections
7. **External Links**: Displays links from `stateLinks` metadata

**State Management**:
```typescript
- documents: Document[]           // All documents
- stateLinks: Record<...>         // External links per state
- searchTerm: string              // Search query
- selectedCategory: string         // Category filter
- selectedState: string           // State filter
- expandedSections: Set<string>   // Expanded section keys
```

**Grouping Logic**:
1. Filters documents based on search/filters
2. Groups by state: `{ [state]: { [subfolder]: Document[] } }`
3. Creates `documentTypes` array for rendering

**Download Flow**:
1. User clicks download button
2. Calls `/api/documents/download?url={doc.downloadUrl}`
3. Receives blob response
4. Creates temporary download link
5. Triggers download
6. Cleans up URL

---

### Upload Component: `DocumentUpload.tsx`

**Visibility**: Only shown to admin users

**Features**:
- File selection
- Folder path input
- Upload progress
- Success/error feedback

**Upload Flow**:
1. User selects file and enters folder path
2. Creates FormData with file and folderPath
3. POSTs to `/api/documents/upload`
4. Displays result message

---

## Key Design Patterns

### 1. Archive Folder Hiding
**Problem**: Archive folders should exist in storage but not appear in UI

**Solution**: Filter logic in both API endpoints:
```typescript
const hasArchiveFolder = pathParts.some(part => 
  part.toUpperCase().includes('ARCHIVE') || 
  part.toUpperCase().endsWith('_ARCHIVE')
);
if (hasArchiveFolder) return false; // Exclude
```

### 2. State Extraction
**Dynamic State Detection**: Extracts state from first path segment
```typescript
const parts = pathname.split('/').filter(Boolean);
return parts.length > 0 ? parts[0] : undefined;
```
**Benefit**: No hardcoded state list, works with any state name

### 3. Metadata Separation
**Metadata Folder**: `_metadata/` contains configuration files
- Excluded from document listings
- Loaded separately for external links
- Allows adding more metadata without cluttering document list

### 4. Authentication Proxy
**Download Proxy**: `/api/documents/download` ensures:
- Only authenticated users can download
- Can add logging/analytics
- Can implement rate limiting
- Can add access control rules

---

## Data Flow

### Document Listing Flow
```
User → /documents page
  ↓
useEffect → fetch('/api/documents')
  ↓
API: list() from @vercel/blob
  ↓
Filter (exclude archives, metadata, JSON)
  ↓
Load stateLinks from _metadata/manual_billing_links.json
  ↓
Transform to Document objects
  ↓
Return { documents, stateLinks }
  ↓
Frontend: Group by state → subfolder
  ↓
Render expandable sections
```

### Upload Flow
```
Admin → DocumentUpload component
  ↓
Select file + enter folder path
  ↓
POST /api/documents/upload (FormData)
  ↓
API: Validate admin email
  ↓
put(fullPath, file, { access: 'public' })
  ↓
Return { url, pathname }
  ↓
Display success message
```

### Download Flow
```
User → Click download button
  ↓
GET /api/documents/download?url={blobUrl}
  ↓
API: Validate authentication
  ↓
fetch(blobUrl) → Get file
  ↓
Return file with headers
  ↓
Frontend: Create blob URL → Trigger download
```

---

## File Path Examples

### Valid Document Paths
```
ALABAMA/ABA/document.pdf
CALIFORNIA/BH/policy_2024.pdf
TEXAS/BILLING_MANUALS/manual_v2.pdf
NEW_YORK/IDD/guidelines.pdf
```

### Archive Paths (Hidden from UI)
```
ALABAMA/ABA_ARCHIVE/old_document.pdf
CALIFORNIA/BH_ARCHIVE/archived_policy.pdf
```

### Metadata Paths (Excluded)
```
_metadata/manual_billing_links.json
_metadata/state_config.json
```

---

## Security Considerations

1. **Authentication**: All endpoints require Kinde authentication
2. **Admin-Only Operations**: Upload and archive creation restricted to admin emails
3. **Public Access**: Files are stored with `access: 'public'` but download is proxied through authenticated endpoint
4. **Path Validation**: No explicit path validation (relies on admin responsibility)

---

## Limitations & Considerations

1. **No Empty Folders**: Vercel Blob doesn't support empty folders, uses `.gitkeep` placeholders
2. **No File Deletion API**: Currently no endpoint to delete files
3. **No File Rename/Move**: No endpoint to rename or move files
4. **No Versioning**: No built-in version control
5. **No Metadata Editing**: External links stored in JSON file, no UI to edit
6. **Hardcoded Admin List**: Admin emails hardcoded in multiple places
7. **No File Size Limits**: No explicit size limits in code (relies on Vercel Blob limits)

---

## Potential Enhancements

1. **File Management UI**: Add delete, rename, move operations
2. **Metadata Editor**: UI to edit `manual_billing_links.json`
3. **File Preview**: Preview PDFs/images before download
4. **Bulk Operations**: Upload/delete multiple files
5. **Search Improvements**: Full-text search within PDFs
6. **Version History**: Track file versions
7. **Access Control**: Per-file or per-folder permissions
8. **Activity Log**: Track uploads, downloads, deletions
9. **Storage Analytics**: Better visualization of storage usage
10. **Admin Panel**: Centralized admin interface for all operations

---

## Related Scripts

Located in `scripts/` directory:
- `verify-and-sync-all-states.ts`: Sync local files with blob storage
- `compare-local-vs-blob.ts`: Compare local vs cloud storage
- `merge-local-and-blob.ts`: Merge local and cloud files
- `create-south-dakota-folders.ts`: Create folder structure for new states

---

## Summary

The Document Library is a well-structured system that:
- ✅ Organizes documents hierarchically (State → Subfolder → File)
- ✅ Hides archive folders from UI while keeping them in storage
- ✅ Provides authenticated access to all documents
- ✅ Supports admin uploads with folder structure
- ✅ Includes external links per state
- ✅ Groups and filters documents effectively
- ✅ Uses Vercel Blob Storage for scalable file storage

The system is production-ready but could benefit from additional file management features and a more robust admin interface.

