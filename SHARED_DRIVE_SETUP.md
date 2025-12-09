# Google Workspace Shared Drive Setup Guide

## Step 1: Check if You Have Google Workspace

1. Go to [Google Drive](https://drive.google.com)
2. Look at the left sidebar
3. If you see **"Shared drives"** (or "Team drives" in older versions), you have Google Workspace ✅
4. If you don't see "Shared drives", you have a free Google account and need to:
   - Sign up for Google Workspace (paid), OR
   - Use the OAuth 2.0 user authentication method instead

## Step 2: Create a Shared Drive

1. In Google Drive, click **"Shared drives"** in the left sidebar
2. Click the **"+"** button (or "New" button) at the top
3. Click **"New shared drive"**
4. Name it: **"Medirate Document Library"** (or match your `GOOGLE_DRIVE_ROOT_FOLDER`)
5. Click **"Create"**

## Step 3: Add Service Account to Shared Drive

1. Open the Shared Drive you just created
2. Click the **"Manage members"** button (or the people icon) at the top
3. In the "Add members" field, enter your service account email:
   ```
   medirate-drive-service@medirate-database-update.iam.gserviceaccount.com
   ```
4. Set the role to **"Content manager"** (or "Manager" - gives full access)
5. **Uncheck** "Notify people" (service accounts don't have email)
6. Click **"Send"**

## Step 4: Verify Service Account Access

The service account should now be able to:
- List files in the Shared Drive
- Create folders in the Shared Drive
- Upload files to the Shared Drive

## Step 5: Update Your Code

The code will automatically detect if it's a Shared Drive and use the correct API parameters. Just make sure your `GOOGLE_DRIVE_ROOT_FOLDER` matches the Shared Drive name.

## Step 6: Test the Migration

Once the Shared Drive is set up, run the migration script again:
```bash
pnpm migrate:blob-to-drive
```

It should now work! ✅

## Troubleshooting

### "Shared drives" option not visible
- You don't have Google Workspace
- Options:
  1. Sign up for Google Workspace (paid)
  2. Use OAuth 2.0 user authentication instead (free, but requires setup)

### Service account can't access Shared Drive
- Make sure you added the service account as a member
- Check the role is "Content manager" or "Manager"
- Wait a few minutes for permissions to propagate

### Migration still fails
- Verify the Shared Drive name matches `GOOGLE_DRIVE_ROOT_FOLDER`
- Check that the service account appears in "Manage members"
- Try running the test script: `pnpm tsx scripts/test-google-drive-permissions.ts`

