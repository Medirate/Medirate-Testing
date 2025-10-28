# MediRate Document Library System

## Overview
This document explains how the MediRate document library system works, including the upload process, folder structure, and how to replicate the exact folder structure from local storage to Vercel Blob storage.

## System Architecture

### 1. Storage Layer
- **Vercel Blob Storage**: Cloud storage for all documents
- **Virtual Folders**: Vercel Blob uses virtual folders created by slashes in pathnames
- **Public Access**: All documents are publicly accessible via URLs

### 2. Frontend Layer
- **Documents Page**: `/src/app/documents/page.tsx`
- **Hierarchical Display**: States → Subfolders → Individual Documents
- **Search & Filter**: By state, category, and text content

### 3. API Layer
- **Documents API**: `/src/app/api/documents/route.ts`
- **Upload API**: `/src/app/api/documents/upload/route.ts`
- **Download API**: `/src/app/api/documents/download/route.ts`

## Folder Structure

### Source Folder Structure (Local)
```
MEDIRATE DOCUMENTS/
├── ALABAMA/
│   ├── ABA/
│   │   └── Alabama ASD Fee Schedule 12072021.pdf
│   ├── BH/
│   │   ├── Alabama Behavioral Health Fee Schedule 03202024.pdf
│   │   ├── Alabama Rehab Option Fee Schedule DHR 10072024.pdf
│   │   ├── Alabama Rehab Option Fee Schedule MI 07012025.pdf
│   │   └── Alabama Rehab Option Fee Schedule SA 10072024.pdf
│   ├── BILLING MANUALS/
│   │   ├── Apr25_Revision Changes.pdf
│   │   ├── Jan25_Revision Changes.pdf
│   │   ├── Jul25_Revision Changes.pdf
│   │   └── Oct25_Revision Changes.pdf
│   └── IDD/
│       ├── Alabama ADMH DDD Intellectual Disabilities Waiver Fee Schedule 01052024.pdf
│       └── Alabama Community Waiver Program Fee Schedule 04292024.pdf
├── ALASKA/
│   ├── ABA/
│   ├── BH/
│   ├── HCBS/
│   └── IDD/
├── ARIZONA/
│   ├── ABA/
│   ├── BH/
│   ├── HCBS/
│   └── IDD/
└── ... (all 50 states + DC)
```

### Vercel Blob Structure (Cloud)
```
ALABAMA/ABA/Alabama ASD Fee Schedule 12072021.pdf
ALABAMA/BH/Alabama Behavioral Health Fee Schedule 03202024.pdf
ALABAMA/BILLING MANUALS/Apr25_Revision Changes.pdf
ALABAMA/IDD/Alabama ADMH DDD Intellectual Disabilities Waiver Fee Schedule 01052024.pdf
ALASKA/ABA/Alaska Applied Behavior Analysis Fee Schedule 07012025.pdf
... (all files with full path structure)
```

## Upload Process

### Step 1: Prepare the Upload Script
Create a Node.js script that uses the Vercel Blob API:

```javascript
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function uploadAllDocuments() {
  const documentsPath = '/path/to/MEDIRATE DOCUMENTS';
  const token = 'your_vercel_blob_token';
  
  // Upload all files maintaining folder structure
  async function uploadFiles(dir, relativePath = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively upload files in subdirectories
        const newRelativePath = relativePath ? `${relativePath}/${file}` : file;
        await uploadFiles(filePath, newRelativePath);
      } else if (stat.isFile()) {
        const ext = path.extname(file).toLowerCase();
        if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'].includes(ext)) {
          const blobPath = relativePath ? `${relativePath}/${file}` : file;
          
          try {
            console.log(`📤 Uploading: ${blobPath}`);
            
            const fileBuffer = fs.readFileSync(filePath);
            const blob = await put(blobPath, fileBuffer, {
              access: 'public',
              token: token
            });
            
            console.log(`✅ Uploaded: ${blobPath}`);
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`⚠️  Skipped (already exists): ${blobPath}`);
            } else {
              console.error(`❌ Failed to upload ${blobPath}:`, error.message);
            }
          }
        }
      }
    }
  }
  
  await uploadFiles(documentsPath);
}

uploadAllDocuments().catch(console.error);
```

### Step 2: Set Up Environment
1. **Install Vercel Blob**: `npm install @vercel/blob`
2. **Get Blob Token**: From Vercel dashboard → Storage → Blob
3. **Set Token**: Add to environment variables or use directly in script

### Step 3: Run Upload
```bash
node upload-script.js
```

## Frontend Display Logic

### State Grouping
The frontend groups documents by state first, then by subfolder:

```typescript
// Group documents by state first, then by subfolder
const groupedByState = filteredDocuments.reduce((acc, doc) => {
  const state = doc.state || 'Other';
  if (!acc[state]) {
    acc[state] = {};
  }
  
  // Extract subfolder from folder path (e.g., "ALABAMA/ABA" -> "ABA")
  const folderParts = doc.folder.split('/');
  const subfolder = folderParts.length > 1 ? folderParts[folderParts.length - 1] : 'Root';
  
  if (!acc[state][subfolder]) {
    acc[state][subfolder] = [];
  }
  acc[state][subfolder].push(doc);
  return acc;
}, {} as Record<string, Record<string, Document[]>>);
```

### State Extraction
The API extracts state names from file paths:

```typescript
function extractStateFromPath(pathname: string): string | undefined {
  const pathParts = pathname.split('/');
  
  // State names must match actual folder names (with spaces)
  const stateNames = [
    'ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO', 'CONNECTICUT',
    'DELAWARE', 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO', 'ILLINOIS', 'INDIANA', 'IOWA',
    'KANSAS', 'KENTUCKY', 'LOUISIANA', 'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN',
    'MINNESOTA', 'MISSISSIPPI', 'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA', 'NEW HAMPSHIRE',
    'NEW JERSEY', 'NEW MEXICO', 'NEW YORK', 'NORTH CAROLINA', 'NORTH DAKOTA', 'OHIO',
    'OKLAHOMA', 'OREGON', 'PENNSYLVANIA', 'RHODE ISLAND', 'SOUTH CAROLINA', 'SOUTH DAKOTA',
    'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON', 'WEST VIRGINIA',
    'WISCONSIN', 'WYOMING', 'DC'
  ];
  
  for (const part of pathParts) {
    const upperPart = part.toUpperCase();
    if (stateNames.includes(upperPart)) {
      return upperPart;
    }
  }
  
  return undefined;
}
```

## UI Structure

### Main Display
- **States as Main Groups**: Each state is a collapsible card
- **Subfolders as Categories**: ABA, BH, BILLING MANUALS, IDD, etc.
- **Documents as Items**: Individual files within each subfolder

### Example UI Flow
```
📁 ALABAMA (4 categories • 11 documents) ▼
  ├── 📄 ABA (1 document) ▼
  │   └── Alabama ASD Fee Schedule 12072021.pdf
  ├── 📄 BH (4 documents) ▼
  │   ├── Alabama Behavioral Health Fee Schedule 03202024.pdf
  │   ├── Alabama Rehab Option Fee Schedule DHR 10072024.pdf
  │   ├── Alabama Rehab Option Fee Schedule MI 07012025.pdf
  │   └── Alabama Rehab Option Fee Schedule SA 10072024.pdf
  ├── 📄 BILLING MANUALS (4 documents) ▼
  │   ├── Apr25_Revision Changes.pdf
  │   ├── Jan25_Revision Changes.pdf
  │   ├── Jul25_Revision Changes.pdf
  │   └── Oct25_Revision Changes.pdf
  └── 📄 IDD (2 documents) ▼
      ├── Alabama ADMH DDD Intellectual Disabilities Waiver Fee Schedule 01052024.pdf
      └── Alabama Community Waiver Program Fee Schedule 04292024.pdf
```

## Key Files

### 1. Documents Page
- **File**: `src/app/documents/page.tsx`
- **Purpose**: Main UI for displaying documents
- **Features**: Hierarchical display, search, filters, download

### 2. Documents API
- **File**: `src/app/api/documents/route.ts`
- **Purpose**: Fetches documents from Vercel Blob
- **Features**: State extraction, folder parsing, document metadata

### 3. Upload API
- **File**: `src/app/api/documents/upload/route.ts`
- **Purpose**: Handles new document uploads
- **Features**: Admin authentication, file validation, blob storage

### 4. Download API
- **File**: `src/app/api/documents/download/route.ts`
- **Purpose**: Handles document downloads
- **Features**: URL validation, file streaming

## Replication Instructions

### For Future AI Assistants

1. **Get the folder location** from the user
2. **Verify the structure** matches the expected format:
   - States as top-level folders
   - Subfolders: ABA, BH, BILLING MANUALS, IDD, HCBS, etc.
   - Documents inside subfolders

3. **Create upload script** using the provided template
4. **Set up environment**:
   - Install `@vercel/blob`
   - Get Vercel Blob token
   - Update script with correct paths

5. **Run the upload**:
   ```bash
   node upload-script.js
   ```

6. **Verify the upload**:
   - Check Vercel Blob dashboard
   - Test the documents page
   - Ensure all states appear correctly

### Important Notes

- **State Names**: Must use spaces, not underscores (e.g., "NEW HAMPSHIRE", not "NEW_HAMPSHIRE")
- **File Types**: Only uploads `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.txt` files
- **Rate Limiting**: Add delays between uploads to avoid API limits
- **Error Handling**: Skip existing files, log errors for failed uploads
- **Folder Structure**: Maintain exact folder structure from source to blob storage

## Troubleshooting

### Common Issues

1. **States showing as "Other"**:
   - Check state names in `extractStateFromPath` function
   - Ensure folder names match exactly (case-sensitive)

2. **Upload failures**:
   - Check Vercel Blob token
   - Verify file permissions
   - Check for rate limiting

3. **Missing documents**:
   - Check file extensions (only certain types are uploaded)
   - Verify folder structure matches expected format

4. **UI not updating**:
   - Clear browser cache
   - Check API responses in network tab
   - Verify blob storage has correct pathnames

## Environment Variables

```env
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
VERCEL_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

## Dependencies

```json
{
  "@vercel/blob": "^0.21.0"
}
```

## Success Criteria

✅ All 50 states + DC appear as main groups  
✅ Each state shows correct subfolder categories  
✅ Document counts are accurate  
✅ Download functionality works  
✅ Search and filters work  
✅ Hierarchical structure matches source folder  

This system provides a scalable, maintainable way to manage and display document libraries with proper organization and user-friendly navigation.
