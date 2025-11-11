# Vercel Blob Storage - Folder Structure Analysis

## How the Documents System Works

### 1. **Storage Location**
- **Service**: Vercel Blob Storage
- **Access**: Via `@vercel/blob` package using `list()` function
- **Authentication**: Requires `BLOB_READ_WRITE_TOKEN` environment variable

### 2. **Folder Structure Pattern**

The Vercel Blob storage uses a **virtual folder structure** based on pathnames. The structure follows this pattern:

```
STATE_NAME/SUBFOLDER/FILENAME.EXTENSION
```

**Example:**
```
ALABAMA/ABA/Alabama ASD Fee Schedule 12072021.pdf
ALABAMA/BH/Alabama Behavioral Health Fee Schedule 03202024.pdf
ALABAMA/BILLING_MANUALS/Apr25_Revision Changes.pdf
ALABAMA/IDD/Alabama ADMH DDD Intellectual Disabilities Waiver Fee Schedule 01052024.pdf
```

### 3. **Pathname Breakdown**

From the code in `src/app/api/documents/route.ts`:

```typescript
// Extract folder structure from pathname
const pathParts = filePath.split('/').filter(part => part && part !== '');
const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : 'Root';

// Extract subfolder (like ABA, BH, BILLING_MANUALS, IDD)
const subfolder = pathParts.length > 2 ? pathParts[pathParts.length - 2] : null;

// Extract state (first part of pathname)
const state = extractStateFromPath(blob.pathname); // Returns parts[0]
```

**Structure Levels:**
- **Level 1**: State name (e.g., `ALABAMA`, `CALIFORNIA`, `TEXAS`)
- **Level 2**: Subfolder/category (e.g., `ABA`, `BH`, `BILLING_MANUALS`, `IDD`, `HCBS`)
- **Level 3**: Filename (e.g., `Alabama ASD Fee Schedule 12072021.pdf`)

### 4. **Common Subfolders**

Based on the code and typical Medicaid document organization:

- **ABA** - Applied Behavior Analysis documents
- **BH** - Behavioral Health documents
- **BILLING_MANUALS** - Billing manual documents
- **IDD** - Intellectual and Developmental Disabilities documents
- **HCBS** - Home and Community-Based Services documents

### 5. **Metadata Files**

The system also stores metadata files in a special `_metadata/` folder:

```
_metadata/manual_billing_links.json
```

This file contains external links for each state that are displayed alongside documents.

### 6. **How to Access the Structure**

#### Option 1: Via API Endpoint (Recommended)

I've created a new API endpoint at `/api/documents/structure` that returns the complete folder structure:

```bash
# Start the dev server
pnpm dev

# Then access:
http://localhost:3000/api/documents/structure
```

**Response includes:**
- Complete folder structure organized by state → subfolder → files
- Statistics (total files, sizes, counts)
- Metadata files list
- Breakdown by state with file counts and sizes

#### Option 2: Via Documents Page

The documents page (`/documents`) automatically displays the structure:
- States are shown as expandable sections
- Subfolders are shown within each state
- Files are listed within each subfolder

#### Option 3: Direct Blob API

You can also use the Vercel Blob API directly:

```typescript
import { list } from '@vercel/blob';

const { blobs } = await list();
// blobs contains all files with pathname, size, uploadedAt, url
```

### 7. **File Filtering**

The system filters out:
- Files starting with `_metadata/` (metadata directory)
- Files ending with `.json` (JSON helper files)

Only actual document files are shown in the UI.

### 8. **Expected Folder Structure**

Based on the code logic, the expected structure in Vercel Blob should be:

```
ALABAMA/
├── ABA/
│   └── [PDF files]
├── BH/
│   └── [PDF files]
├── BILLING_MANUALS/
│   └── [PDF files]
└── IDD/
    └── [PDF files]

ALASKA/
├── ABA/
├── BH/
├── HCBS/
└── IDD/

ARIZONA/
├── ABA/
├── BH/
└── [other subfolders]

[Other states...]

_metadata/
└── manual_billing_links.json
```

### 9. **Key Functions**

**`extractStateFromPath(pathname: string)`**
- Returns the first part of the pathname (state name)
- Example: `"ALABAMA/ABA/file.pdf"` → `"ALABAMA"`

**`formatFileSize(bytes: number)`**
- Converts bytes to human-readable format (KB, MB, GB)

**State Extraction Logic:**
```typescript
function extractStateFromPath(pathname: string): string | undefined {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length > 0 ? parts[0] : undefined;
}
```

### 10. **To View the Actual Structure**

1. **Start the development server:**
   ```bash
   pnpm dev
   ```

2. **Access the structure API:**
   - Open: `http://localhost:3000/api/documents/structure`
   - Or use curl: `curl http://localhost:3000/api/documents/structure`

3. **Or view in the UI:**
   - Navigate to: `http://localhost:3000/documents`
   - The page will show all states, subfolders, and files

### 11. **Notes**

- The folder structure is **virtual** - Vercel Blob doesn't have actual folders, just pathnames with slashes
- State names are extracted dynamically from the first part of the pathname
- The system supports any state name without hardcoding
- Subfolders are extracted from the second part of the pathname
- Files can be at any depth, but the UI expects: `STATE/SUBFOLDER/FILENAME`

### 12. **API Response Format**

The `/api/documents/structure` endpoint returns:

```json
{
  "success": true,
  "structure": {
    "ALABAMA": {
      "ABA": [
        {
          "pathname": "ALABAMA/ABA/file.pdf",
          "size": 123456,
          "uploadedAt": "2024-01-01T00:00:00.000Z",
          "url": "https://..."
        }
      ],
      "BH": [...]
    }
  },
  "stats": {
    "totalFiles": 100,
    "documentFiles": 95,
    "metadataFiles": 5,
    "states": 50,
    "stateBreakdown": [...]
  }
}
```

