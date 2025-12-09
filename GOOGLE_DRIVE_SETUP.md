# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration to replace Vercel Blob Storage.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Admin access to your application

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name (e.g., "MediRate Documents")
5. Click "Create"

## Step 2: Enable Google Drive API

1. In your project, go to "APIs & Services" > "Library"
2. Search for "Google Drive API"
3. Click on it and click "Enable"

## Step 3: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Enter a name (e.g., "medirate-drive-service")
4. Click "Create and Continue"
5. Skip role assignment (click "Continue")
6. Click "Done"

## Step 4: Create Service Account Key

1. In the Service Accounts list, click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create" - this downloads a JSON file

## Step 5: Extract Credentials from JSON

Open the downloaded JSON file. You'll need:

- `client_email` → `GOOGLE_DRIVE_CLIENT_EMAIL`
- `private_key` → `GOOGLE_DRIVE_PRIVATE_KEY`
- `project_id` → `GOOGLE_DRIVE_PROJECT_ID`

## Step 6: Set Up Google Drive Folder Structure

1. Open [Google Drive](https://drive.google.com)
2. Create a folder named "MediRate Documents" (or your preferred name)
3. Create your state folders inside (e.g., ALABAMA, CALIFORNIA, etc.)
4. Create subfolders inside each state (e.g., ABA, BH, IDD, etc.)

**Example structure:**
```
MediRate Documents/
├── ALABAMA/
│   ├── ABA/
│   ├── BH/
│   └── IDD/
├── CALIFORNIA/
│   ├── ABA/
│   └── BH/
└── _metadata/
    └── manual_billing_links.json
```

## Step 7: Share Folder with Service Account

1. Right-click on "MediRate Documents" folder
2. Click "Share"
3. Enter the service account email (from Step 4, the `client_email` field)
4. Give it "Editor" permissions
5. Click "Send" (uncheck "Notify people" if you don't want an email)

**Important:** The service account email looks like:
`your-service-account@your-project.iam.gserviceaccount.com`

## Step 8: Configure Environment Variables

Add these to your `.env.local` file:

```env
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_PROJECT_ID=your-project-id
GOOGLE_DRIVE_ROOT_FOLDER=MediRate Documents
```

**Important Notes:**
- The `GOOGLE_DRIVE_PRIVATE_KEY` must include the `\n` characters (newlines)
- Keep the quotes around the private key
- The private key should be the entire key including BEGIN and END lines

## Step 9: Install Google Drive Desktop (Optional but Recommended)

For easy file management through Windows File Explorer:

1. Download [Google Drive for Desktop](https://www.google.com/drive/download/)
2. Install and sign in with the Google account that owns the Drive
3. The "MediRate Documents" folder will appear in your file system
4. You can now manage files directly through Windows File Explorer!

**Location:** Usually `G:\My Drive\MediRate Documents\` or `C:\Users\YourName\Google Drive\MediRate Documents\`

## Step 10: Test the Integration

1. Restart your Next.js development server
2. Navigate to `/documents` page
3. You should see files from Google Drive
4. Try uploading a file through the admin interface
5. Try downloading a file

## Troubleshooting

### "Root folder not found" error
- Make sure the folder name matches `GOOGLE_DRIVE_ROOT_FOLDER`
- Verify the folder is shared with the service account email
- Check that the service account has "Editor" permissions

### "Unauthorized" or "Permission denied" errors
- Verify the service account email is correct
- Check that the folder is shared with the service account
- Ensure the private key is correctly formatted with `\n` characters

### Files not appearing
- Check that files are not in archive folders (folders with "ARCHIVE" in the name)
- Verify files are not in BILLING_MANUALS folders (these are hidden)
- Make sure files have synced to Google Drive (if using Desktop app)

### Upload fails
- Check service account has "Editor" permissions on the root folder
- Verify the folder path exists or can be created
- Check file size limits (Google Drive has limits)

## Managing Files

### Via Windows File Explorer (Recommended)
1. Open Google Drive Desktop folder
2. Navigate to `MediRate Documents`
3. Add/remove/organize files like any Windows folder
4. Changes sync automatically to Google Drive
5. Refresh your app to see changes

### Via Google Drive Web Interface
1. Go to [drive.google.com](https://drive.google.com)
2. Navigate to "MediRate Documents"
3. Upload files, create folders, etc.
4. Changes appear in your app after refresh

### Via Your App's Upload Interface
- Admin users can still upload through the web interface
- Files are uploaded directly to Google Drive

## Archive Folders

Folders with "ARCHIVE" in the name are automatically hidden from the UI, just like before. You can create archive folders in Google Drive and files inside them won't appear in the document library.

## Metadata File

The `manual_billing_links.json` file should be placed in:
```
MediRate Documents/_metadata/manual_billing_links.json
```

Format:
```json
{
  "stateLinks": {
    "ALABAMA": [
      "https://example.com/link1",
      {
        "title": "Billing Manual",
        "url": "https://example.com/manual"
      }
    ]
  }
}
```

## Security Notes

- Never commit the service account JSON file to git
- Keep your `.env.local` file secure
- The service account should only have access to the specific folder it needs
- Regularly rotate service account keys if needed

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check server logs for API errors
3. Verify all environment variables are set correctly
4. Test the service account permissions in Google Cloud Console


