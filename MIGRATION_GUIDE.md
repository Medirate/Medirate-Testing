# Migration Guide: Vercel Blob → Google Drive

This guide will help you migrate all your documents from Vercel Blob Storage to Google Drive.

## Prerequisites

1. ✅ Google Drive API enabled
2. ✅ Service Account created with JSON key downloaded
3. ✅ Environment variables configured in `.env.local`
4. ✅ Root folder "MediRate Documents" created in Google Drive
5. ✅ Root folder shared with service account email (Editor permissions)

## Step-by-Step Migration

### 1. Verify Environment Variables

Make sure your `.env.local` has:
```env
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PROJECT_ID=your-project-id
GOOGLE_DRIVE_ROOT_FOLDER=MediRate Documents
```

### 2. Run the Migration Script

Simply run:
```bash
pnpm migrate:blob-to-drive
```

### 3. What the Script Does

The migration script will:

1. **Fetch all files** from Vercel Blob Storage
2. **Filter files** (excludes archives, BILLING_MANUALS, but includes metadata)
3. **Create folder structure** in Google Drive automatically
4. **Download each file** from Vercel Blob
5. **Upload to Google Drive** in the correct folder location
6. **Show progress** for each file
7. **Print summary** at the end

### 4. Expected Output

You'll see output like:
```
🚀 Starting migration from Vercel Blob to Google Drive...

📥 Fetching files from Vercel Blob...
✅ Found 150 files in Vercel Blob

📁 Looking for root folder: "MediRate Documents"...
✅ Found root folder (ID: 1a2b3c4d5e6f7g8h)

📋 Files to migrate: 120
   (Excluded: 30 files)

🔄 Starting migration...

✅ [1/120] ALABAMA/ABA/document1.pdf
✅ [2/120] ALABAMA/ABA/document2.pdf
✅ [3/120] ALABAMA/BH/document3.pdf
...

============================================================
📊 Migration Summary
============================================================
Total files:     120
✅ Successful:   120
❌ Failed:       0
⏭️  Skipped:      0

🎉 Migration completed successfully!
```

### 5. What Gets Migrated

**✅ Included:**
- All regular document files (PDFs, DOCs, etc.)
- Metadata file (`_metadata/manual_billing_links.json`)
- All state folders and subfolders

**❌ Excluded (same as UI filtering):**
- Archive folders (anything with "ARCHIVE" in name)
- BILLING_MANUALS folders
- Other JSON files (except metadata)

### 6. Folder Structure

The script automatically creates the exact same folder structure:
```
MediRate Documents/
├── ALABAMA/
│   ├── ABA/
│   │   ├── document1.pdf
│   │   └── document2.pdf
│   ├── BH/
│   │   └── document3.pdf
│   └── IDD/
│       └── document4.pdf
├── CALIFORNIA/
│   └── ABA/
│       └── document5.pdf
└── _metadata/
    └── manual_billing_links.json
```

### 7. If Migration Fails

If some files fail to migrate:

1. **Check the error messages** - they'll tell you what went wrong
2. **Common issues:**
   - Service account doesn't have permissions → Share folder again
   - Rate limiting → Wait a few minutes and re-run
   - Network issues → Check internet connection
3. **Re-run the script** - It's safe to run multiple times (won't duplicate files)

### 8. After Migration

Once migration completes:

1. **Verify in Google Drive:**
   - Open Google Drive
   - Check "MediRate Documents" folder
   - Verify all files are there

2. **Test in your app:**
   - Restart your Next.js server
   - Go to `/documents` page
   - Verify all documents appear

3. **Optional - Install Google Drive Desktop:**
   - Download [Google Drive for Desktop](https://www.google.com/drive/download/)
   - Sign in with the Google account
   - You'll see "MediRate Documents" in Windows File Explorer
   - You can now manage files directly!

### 9. Cleanup (Optional)

After verifying everything works:

1. **Keep Vercel Blob as backup** (recommended for a few weeks)
2. **Or delete from Vercel Blob** if you're confident everything migrated

## Troubleshooting

### "Root folder not found"
- Make sure folder name matches `GOOGLE_DRIVE_ROOT_FOLDER`
- Verify folder is shared with service account
- Check service account email is correct

### "Permission denied" errors
- Re-share the root folder with service account
- Make sure service account has "Editor" permissions
- Check the service account email is correct

### Rate limiting errors
- Google Drive API has rate limits
- The script includes small delays between uploads
- If you hit limits, wait 1-2 minutes and re-run
- Failed files will be listed in the summary

### Network errors
- Check your internet connection
- Verify Vercel Blob is accessible
- Re-run the script - it will skip already-migrated files

## Notes

- **Safe to re-run:** The script won't create duplicates
- **Progress tracking:** Shows current file number and total
- **Error handling:** Continues even if some files fail
- **Preserves structure:** Exact folder hierarchy maintained
- **File metadata:** File names, types, and organization preserved

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify all environment variables are set
3. Test service account permissions in Google Drive
4. Check Google Cloud Console for API quota/errors

