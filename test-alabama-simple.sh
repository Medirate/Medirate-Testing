#!/bin/bash

# Test script to upload just Alabama files
echo "🚀 Testing upload with Alabama files..."

# Navigate to the documents directory
cd "/home/dev/Downloads/MEDIRATE DOCUMENTS"

# Upload Alabama files
echo "📤 Uploading Alabama documents..."

# Upload ABA files
for file in ALABAMA/ABA/*.pdf; do
    if [ -f "$file" ]; then
        echo "Uploading: $file"
        vercel blob put "$file" --rw-token "vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy"
    fi
done

# Upload BH files
for file in ALABAMA/BH/*.pdf; do
    if [ -f "$file" ]; then
        echo "Uploading: $file"
        vercel blob put "$file" --rw-token "vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy"
    fi
done

echo "✅ Alabama upload test complete!"
echo "📋 Checking uploaded files..."
vercel blob list --rw-token "vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy"
