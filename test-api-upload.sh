#!/bin/bash

# Test script to upload with folder structure using API
echo "🚀 Testing folder structure upload..."

# Upload one file with proper folder structure
curl -X POST \
  -H "Authorization: Bearer vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy" \
  -F "file=@/home/dev/Downloads/MEDIRATE DOCUMENTS/ALABAMA/ABA/Alabama ASD Fee Schedule 12072021.pdf" \
  -F "pathname=ALABAMA/ABA/Alabama ASD Fee Schedule 12072021.pdf" \
  "https://api.vercel.com/v1/blob"

echo "✅ Upload test complete!"
