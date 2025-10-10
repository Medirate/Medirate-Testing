# Vercel Blob Storage Setup - Download Only

This application uses Vercel Blob storage for document downloads only. Files are managed through Vercel dashboard.

## 1. Vercel Blob Limits

- **Free Tier**: 1GB storage, 1GB bandwidth/month
- **Pro Tier**: 100GB storage, 1TB bandwidth/month
- **File Size Limit**: 50MB per file
- **File Types**: Any (PDF, DOC, XLS, etc.)

## 2. Setup Vercel Blob

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Storage" tab
4. Create a new Blob store
5. Copy the `BLOB_READ_WRITE_TOKEN`

## 3. Environment Variables

Add to `.env.local`:
```env
BLOB_READ_WRITE_TOKEN=your_blob_token_here
```

## 4. Upload Files via Vercel CLI

### Install Vercel CLI:
```bash
npm i -g vercel
```

### Upload files:
```bash
# Upload a single file
vercel blob put documents/state_note/texas_rates_2024.pdf --token=your_token

# Upload multiple files
vercel blob put documents/ --token=your_token
```

## 5. File Organization Structure

```
documents/
├── state_note/
│   ├── texas_rates_2024.pdf
│   ├── california_notes.pdf
│   └── florida_updates.pdf
├── policy/
│   ├── national_policy.pdf
│   └── federal_guidelines.pdf
├── guideline/
│   ├── provider_guidelines.pdf
│   └── implementation_guide.pdf
├── form/
│   ├── application_form.pdf
│   └── renewal_form.pdf
└── report/
    ├── quarterly_analysis.pdf
    └── rate_comparison.pdf
```

## 6. API Endpoints (Read-Only)

- `GET /api/documents` - List all documents
- `GET /api/documents/download` - Download a document

## 7. File Management

### Upload via Vercel CLI:
```bash
# Upload to specific folder
vercel blob put documents/state_note/texas_rates_2024.pdf --token=your_token

# Upload entire directory
vercel blob put documents/ --token=your_token
```

### List files:
```bash
vercel blob list --token=your_token
```

### Delete files:
```bash
vercel blob del documents/old_file.pdf --token=your_token
```

## 8. Best Practices

- **File Naming**: Use descriptive names with underscores
- **Organization**: Group by document type and state
- **Size**: Keep files under 50MB for better performance
- **Formats**: Use PDF for documents, XLSX for spreadsheets
- **Backup**: Keep local copies of important files

## 9. Cost Considerations

- **Free Tier**: Good for testing and small projects
- **Pro Tier**: $20/month for production use
- **Bandwidth**: Monitor usage to avoid overages
- **Storage**: Archive old files to save space
