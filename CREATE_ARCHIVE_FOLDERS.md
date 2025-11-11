# How to Create Archive Folders in Vercel Blob

## Overview

Archive folders need to be created manually in Vercel Blob storage. The code is already set up to hide them from the website once they exist.

## Method 1: Via Vercel CLI (Recommended)

### Prerequisites
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Get your Blob token from Vercel Dashboard:
   - Go to Vercel Dashboard → Your Project → Storage
   - Copy the `BLOB_READ_WRITE_TOKEN`

### Create Archive Folders

Archive folders are created automatically when you upload files to them. You can create empty folders by uploading a placeholder file, or just upload files directly.

**Example: Create archive folder structure for Alabama:**

```bash
# Set your token (or use --token flag each time)
export BLOB_TOKEN="your_blob_token_here"

# Create ABA archive folder (by uploading a placeholder or actual file)
vercel blob put ALABAMA/ABA_ARCHIVE/.gitkeep --token=$BLOB_TOKEN --data="Archive folder"

# Or upload an actual archived file
vercel blob put ALABAMA/ABA_ARCHIVE/old_file_2023.pdf --token=$BLOB_TOKEN --file=./path/to/file.pdf

# Create BH archive folder
vercel blob put ALABAMA/BH_ARCHIVE/.gitkeep --token=$BLOB_TOKEN --data="Archive folder"

# Create BILLING_MANUALS archive folder
vercel blob put ALABAMA/BILLING_MANUALS_ARCHIVE/.gitkeep --token=$BLOB_TOKEN --data="Archive folder"

# Create IDD archive folder
vercel blob put ALABAMA/IDD_ARCHIVE/.gitkeep --token=$BLOB_TOKEN --data="Archive folder"
```

### Create Archive Folders for All States

You'll need to create archive folders for each state and each subfolder. Here's a script approach:

```bash
# States list
STATES=("ALABAMA" "ALASKA" "ARIZONA" "ARKANSAS" "CALIFORNIA" "COLORADO" "CONNECTICUT" "DELAWARE" "FLORIDA" "GEORGIA" "HAWAII" "IDAHO" "ILLINOIS" "INDIANA" "IOWA" "KANSAS" "KENTUCKY" "LOUISIANA" "MAINE" "MARYLAND" "MASSACHUSETTS" "MICHIGAN" "MINNESOTA" "MISSISSIPPI" "MISSOURI" "MONTANA" "NEBRASKA" "NEVADA" "NEW_HAMPSHIRE" "NEW_JERSEY" "NEW_MEXICO" "NEW_YORK" "NORTH_CAROLINA" "NORTH_DAKOTA" "OHIO" "OKLAHOMA" "OREGON" "PENNSYLVANIA" "RHODE_ISLAND" "SOUTH_CAROLINA" "SOUTH_DAKOTA" "TENNESSEE" "TEXAS" "UTAH" "VERMONT" "VIRGINIA" "WASHINGTON" "WEST_VIRGINIA" "WISCONSIN" "WYOMING")

# Common subfolders
SUBFOLDERS=("ABA" "BH" "BILLING_MANUALS" "IDD" "HCBS")

# Create archive folders for each state and subfolder
for STATE in "${STATES[@]}"; do
  for SUBFOLDER in "${SUBFOLDERS[@]}"; do
    echo "Creating archive folder: $STATE/${SUBFOLDER}_ARCHIVE"
    vercel blob put "$STATE/${SUBFOLDER}_ARCHIVE/.gitkeep" --token=$BLOB_TOKEN --data="Archive folder" || true
  done
done
```

## Method 2: Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Storage** → **Blob Store**
4. Click **Upload** or use the file browser
5. Create folders by uploading files with the pathname:
   - `ALABAMA/ABA_ARCHIVE/filename.pdf`
   - `ALABAMA/BH_ARCHIVE/filename.pdf`
   - etc.

**Note:** Vercel Blob doesn't have "empty folders" - folders are created when you upload files to them.

## Method 3: Create a Script

Create a Node.js script to automate the process:

```javascript
// create-archive-folders.js
const { put } = require('@vercel/blob');
const fs = require('fs');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const states = ['ALABAMA', 'ALASKA', 'ARIZONA', /* ... all states ... */];
const subfolders = ['ABA', 'BH', 'BILLING_MANUALS', 'IDD', 'HCBS'];

async function createArchiveFolders() {
  for (const state of states) {
    for (const subfolder of subfolders) {
      const archivePath = `${state}/${subfolder}_ARCHIVE/.gitkeep`;
      try {
        await put(archivePath, new Blob(['Archive folder'], { type: 'text/plain' }), {
          access: 'public',
          token: BLOB_TOKEN
        });
        console.log(`✅ Created: ${archivePath}`);
      } catch (error) {
        console.error(`❌ Failed: ${archivePath}`, error.message);
      }
    }
  }
}

createArchiveFolders();
```

Run with:
```bash
BLOB_READ_WRITE_TOKEN=your_token node create-archive-folders.js
```

## Verification

After creating archive folders, verify they're hidden from the website:

1. **Check Vercel Blob**: Archive folders should be visible in Vercel Dashboard
2. **Check Website**: Archive folders should NOT appear on `/documents` page
3. **Check API**: Archive folders should NOT appear in `/api/documents` response

## Important Notes

- **Folders are virtual**: Vercel Blob doesn't have actual folders - they're created by pathnames
- **No empty folders**: You need to upload at least one file to "create" a folder
- **Automatic hiding**: Once created with `_ARCHIVE` suffix, they're automatically hidden from the website
- **Direct access**: Files in archive folders can still be accessed via direct URLs

## Current Status

✅ **Code is ready**: The filtering logic is implemented and will hide archive folders
⏳ **Folders need creation**: Archive folders need to be created in Vercel Blob storage
📝 **Documentation ready**: Guide available in `ARCHIVE_FOLDERS_GUIDE.md`

Once you create the archive folders in Vercel Blob, they will automatically be hidden from the website!

