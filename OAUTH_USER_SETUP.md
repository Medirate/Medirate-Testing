# OAuth 2.0 User Authentication Setup (Free Google Account)

This allows the app to authenticate as your regular Google account instead of a service account.

## Step 1: Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: **medirate-database-update**
3. Go to **APIs & Services** > **Credentials**
4. Click **"+ CREATE CREDENTIALS"** > **"OAuth client ID"**
5. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (unless you have Workspace)
   - App name: **MediRate Documents**
   - User support email: your email
   - Developer contact: your email
   - Click **"Save and Continue"**
   - Scopes: Click **"Add or Remove Scopes"**
     - Search for and add: `https://www.googleapis.com/auth/drive`
   - Click **"Save and Continue"**
   - Test users: Add your email (`medirate.net@gmail.com`)
   - Click **"Save and Continue"**
   - Click **"Back to Dashboard"**

6. Now create the OAuth client:
   - Application type: **"Web application"**
   - Name: **"MediRate Drive Client"**
   - Authorized redirect URIs: Add:
     ```
     http://localhost:3000/api/auth/google/callback
     http://localhost:3000
     ```
   - Click **"Create"**
   - **Copy the Client ID and Client Secret** (you'll need these)

## Step 2: Get Refresh Token

I'll create a script to help you get the refresh token. You'll run it once to authenticate.

## Step 3: Update Environment Variables

Add these to your `.env.local`:
```env
GOOGLE_DRIVE_CLIENT_ID=your-client-id-here
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret-here
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token-here
GOOGLE_DRIVE_USE_OAUTH=true
```

## Step 4: Update Code

The code will automatically use OAuth if `GOOGLE_DRIVE_USE_OAUTH=true` is set.

