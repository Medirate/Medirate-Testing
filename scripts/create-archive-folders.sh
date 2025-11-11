#!/bin/bash

# Script to create archive folders in Vercel Blob storage
# Usage: ./scripts/create-archive-folders.sh

# Check if BLOB_READ_WRITE_TOKEN is set
if [ -z "$BLOB_READ_WRITE_TOKEN" ]; then
    echo "❌ Error: BLOB_READ_WRITE_TOKEN environment variable is not set"
    echo "Please set it with: export BLOB_READ_WRITE_TOKEN=your_token_here"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI is not installed"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

echo "🚀 Starting archive folder creation..."
echo ""

# States list
STATES=(
    "ALABAMA" "ALASKA" "ARIZONA" "ARKANSAS" "CALIFORNIA" "COLORADO" 
    "CONNECTICUT" "DELAWARE" "FLORIDA" "GEORGIA" "HAWAII" "IDAHO" 
    "ILLINOIS" "INDIANA" "IOWA" "KANSAS" "KENTUCKY" "LOUISIANA" 
    "MAINE" "MARYLAND" "MASSACHUSETTS" "MICHIGAN" "MINNESOTA" 
    "MISSISSIPPI" "MISSOURI" "MONTANA" "NEBRASKA" "NEVADA" 
    "NEW_HAMPSHIRE" "NEW_JERSEY" "NEW_MEXICO" "NEW_YORK" 
    "NORTH_CAROLINA" "NORTH_DAKOTA" "OHIO" "OKLAHOMA" "OREGON" 
    "PENNSYLVANIA" "RHODE_ISLAND" "SOUTH_CAROLINA" "SOUTH_DAKOTA" 
    "TENNESSEE" "TEXAS" "UTAH" "VERMONT" "VIRGINIA" "WASHINGTON" 
    "WEST_VIRGINIA" "WISCONSIN" "WYOMING"
)

# Common subfolders that might exist
SUBFOLDERS=("ABA" "BH" "BILLING_MANUALS" "IDD" "HCBS")

# Counter
TOTAL=0
SUCCESS=0
FAILED=0

# Create archive folders for each state and subfolder
for STATE in "${STATES[@]}"; do
    for SUBFOLDER in "${SUBFOLDERS[@]}"; do
        ARCHIVE_PATH="${STATE}/${SUBFOLDER}_ARCHIVE/.gitkeep"
        TOTAL=$((TOTAL + 1))
        
        echo -n "Creating: ${ARCHIVE_PATH}... "
        
        # Create a small placeholder file to create the folder
        # Vercel Blob doesn't support empty folders, so we create a minimal file
        if echo "Archive folder placeholder" | vercel blob put "$ARCHIVE_PATH" --token="$BLOB_READ_WRITE_TOKEN" > /dev/null 2>&1; then
            echo "✅"
            SUCCESS=$((SUCCESS + 1))
        else
            echo "❌"
            FAILED=$((FAILED + 1))
        fi
    done
done

echo ""
echo "📊 Summary:"
echo "   Total folders attempted: $TOTAL"
echo "   ✅ Successful: $SUCCESS"
echo "   ❌ Failed: $FAILED"
echo ""
echo "✅ Archive folder creation complete!"
echo ""
echo "Note: Some folders may already exist or may fail if the parent folder doesn't exist yet."
echo "This is normal - you can create parent folders first by uploading files to them."

