#!/bin/bash

# Script to upload MEDIRATE DOCUMENTS to Vercel Blob
# This will maintain the exact folder structure

echo "🚀 Starting upload of MEDIRATE DOCUMENTS to Vercel Blob..."

# Navigate to the documents directory
cd "/home/dev/Downloads/MEDIRATE DOCUMENTS"

# Counter for uploaded files
uploaded_count=0
total_files=0

# First, count total files
echo "📊 Counting files..."
total_files=$(find . -type f \( -name "*.pdf" -o -name "*.doc" -o -name "*.docx" -o -name "*.xls" -o -name "*.xlsx" -o -name "*.txt" \) | wc -l)
echo "📁 Found $total_files files to upload"

# Upload all files maintaining folder structure
echo "⬆️  Starting upload process..."

find . -type f \( -name "*.pdf" -o -name "*.doc" -o -name "*.docx" -o -name "*.xls" -o -name "*.xlsx" -o -name "*.txt" \) | while read -r file; do
    # Remove leading ./ from path
    blob_path="${file#./}"
    
    echo "📤 Uploading: $blob_path"
    
    # Upload to Vercel Blob
    if vercel blob put "$file" "$blob_path"; then
        uploaded_count=$((uploaded_count + 1))
        echo "✅ Uploaded: $blob_path ($uploaded_count/$total_files)"
    else
        echo "❌ Failed to upload: $blob_path"
    fi
done

echo "🎉 Upload complete! Uploaded $uploaded_count out of $total_files files"
echo "📁 Folder structure maintained in Vercel Blob storage"
