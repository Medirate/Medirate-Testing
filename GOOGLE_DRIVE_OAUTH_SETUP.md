# Google Drive OAuth Delegation Setup

## The Problem

Service accounts cannot create files in regular Google Drive folders, even with Editor permissions. Google requires either:
1. A Shared Drive (Google Workspace feature), OR
2. OAuth delegation to impersonate a regular user account

## Solution: OAuth Delegation

We'll configure the service account to impersonate your regular Google account (`medirate.net@gmail.com`).

## Step 1: Enable Domain-Wide Delegation

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your service account (`medirate-drive-service@medirate-database-update.iam.gserviceaccount.com`)
4. Click on it to open details
5. Scroll down to **"Domain-wide delegation"** section
6. Click **"Enable Google Workspace Domain-wide Delegation"**
7. Note: This requires a Google Workspace account. If you don't have one, see Alternative Solution below.

## Alternative Solution: Use OAuth 2.0 User Credentials

If you don't have Google Workspace, we can use OAuth 2.0 to authenticate as your regular user account instead of the service account.

### Option A: Use OAuth 2.0 User Flow (Recommended for Personal Accounts)

1. We'll modify the code to use OAuth 2.0 user credentials
2. You'll need to authenticate once and get a refresh token
3. The app will use this refresh token to access Drive on your behalf

### Option B: Create a Shared Drive (If you have Google Workspace)

1. In Google Drive, click **"Shared drives"** in the left sidebar
2. Click **"New"** to create a new Shared Drive
3. Name it "Medirate Document Library"
4. Add the service account as a member with "Content Manager" role
5. Update `GOOGLE_DRIVE_ROOT_FOLDER` to point to the Shared Drive

## Quick Fix: Manual Upload Workaround

For now, you can manually upload files to Google Drive, and the app will read them. The migration script won't work, but the app will function for reading existing files.

Would you like me to:
1. Set up OAuth 2.0 user authentication (works with personal accounts)?
2. Help you create a Shared Drive (requires Google Workspace)?
3. Create a workaround that allows manual uploads?

