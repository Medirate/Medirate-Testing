#!/bin/bash

# Test script to upload Alabama with proper folder structure
echo "🚀 Testing Alabama upload with folder structure..."

# Navigate to the documents directory
cd "/home/dev/Downloads/MEDIRATE DOCUMENTS"

# Upload Alabama files with full paths
echo "📤 Uploading Alabama documents with folder structure..."

# Upload ABA files
for file in ALABAMA/ABA/*.pdf; do
    if [ -f "$file" ]; then
        echo "Uploading: $file"
        vercel blob put "$file" "$file" --rw-token "vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy"
    fi
done

# Upload BH files
for file in ALABAMA/BH/*.pdf; do
    if [ -f "$file" ]; then
        echo "Uploading: $file"
        vercel blob put "$file" "$file" --rw-token "vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy"
    fi
done

# Upload BILLING MANUALS files
for file in "ALABAMA/BILLING MANUALS"/*.pdf; do
    if [ -f "$file" ]; then
        echo "Uploading: $file"
        vercel blob put "$file" "$file" --rw-token "vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy"
    fi
done

# Upload IDD files
for file in ALABAMA/IDD/*.pdf; do
    if [ -f "$file" ]; then
        echo "Uploading: $file"
        vercel blob put "$file" "$file" --rw-token "vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy"
    fi
done

echo "✅ Alabama upload test complete!"
echo "📋 Checking uploaded files with folder structure..."
vercel blob list --rw-token "vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy"
