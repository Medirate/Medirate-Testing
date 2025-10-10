# Vercel Blob Storage Setup

This application now uses Vercel Blob storage for document management. Here's how to set it up:

## 1. Install Vercel Blob

The package is already installed: `@vercel/blob`

## 2. Get Vercel Blob Token

1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to the "Storage" tab
4. Create a new Blob store
5. Copy the `BLOB_READ_WRITE_TOKEN`

## 3. Environment Variables

Add this to your `.env.local` file:

```env
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

## 4. Deploy to Vercel

Make sure to add the environment variable in your Vercel project settings as well.

## 5. Features

- **Upload Documents**: Users can upload files through the Documents page
- **Download Documents**: Users can download files with proper authentication
- **File Organization**: Files are organized by type and state in the blob store
- **Metadata**: Each file includes title, description, tags, and other metadata

## 6. File Structure in Blob Store

```
documents/
├── state_note/
│   ├── Texas/
│   │   └── texas_rates_2024.pdf
│   └── California/
│       └── california_notes.pdf
├── policy/
│   └── national_policy.pdf
├── guideline/
│   └── provider_guidelines.pdf
├── form/
│   └── application_form.pdf
└── report/
    └── analysis_report.pdf
```

## 7. API Endpoints

- `GET /api/documents` - List all documents
- `POST /api/documents` - Upload a new document
- `DELETE /api/documents` - Delete a document
- `GET /api/documents/download` - Download a document

## 8. Security

- All endpoints require authentication
- Files are stored with public access but require authentication to download
- File uploads are validated for type and size
