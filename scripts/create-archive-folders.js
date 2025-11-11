/**
 * Script to create archive folders in Vercel Blob storage
 * Usage: node scripts/create-archive-folders.js
 * 
 * Requires BLOB_READ_WRITE_TOKEN environment variable
 */

const { put } = require('@vercel/blob');

// States list
const STATES = [
  'ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO',
  'CONNECTICUT', 'DELAWARE', 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO',
  'ILLINOIS', 'INDIANA', 'IOWA', 'KANSAS', 'KENTUCKY', 'LOUISIANA',
  'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN', 'MINNESOTA',
  'MISSISSIPPI', 'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA',
  'NEW_HAMPSHIRE', 'NEW_JERSEY', 'NEW_MEXICO', 'NEW_YORK',
  'NORTH_CAROLINA', 'NORTH_DAKOTA', 'OHIO', 'OKLAHOMA', 'OREGON',
  'PENNSYLVANIA', 'RHODE_ISLAND', 'SOUTH_CAROLINA', 'SOUTH_DAKOTA',
  'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON',
  'WEST_VIRGINIA', 'WISCONSIN', 'WYOMING'
];

// Common subfolders
const SUBFOLDERS = ['ABA', 'BH', 'BILLING_MANUALS', 'IDD', 'HCBS'];

async function createArchiveFolders() {
  // Try to get token from environment (Vercel Blob package reads from BLOB_READ_WRITE_TOKEN automatically)
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is not set');
    console.error('');
    console.error('Please set it first:');
    console.error('  export BLOB_READ_WRITE_TOKEN=your_token_here');
    console.error('');
    console.error('Or add it to .env.local file:');
    console.error('  BLOB_READ_WRITE_TOKEN=your_token_here');
    console.error('');
    console.error('You can get the token from:');
    console.error('  Vercel Dashboard → Your Project → Storage → BLOB_READ_WRITE_TOKEN');
    process.exit(1);
  }

  console.log('🚀 Starting archive folder creation...\n');

  let total = 0;
  let success = 0;
  let failed = 0;
  const failedPaths = [];

  for (const state of STATES) {
    for (const subfolder of SUBFOLDERS) {
      const archivePath = `${state}/${subfolder}_ARCHIVE/.gitkeep`;
      total++;

      process.stdout.write(`Creating: ${archivePath}... `);

      try {
        // Create a small placeholder file to create the folder
        // Vercel Blob doesn't support empty folders, so we create a minimal file
        const blob = new Blob(['Archive folder placeholder'], { type: 'text/plain' });
        
        await put(archivePath, blob, {
          access: 'public',
          token: token
        });

        console.log('✅');
        success++;
      } catch (error) {
        console.log('❌');
        console.error(`   Error: ${error.message}`);
        failed++;
        failedPaths.push(archivePath);
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Total folders attempted: ${total}`);
  console.log(`   ✅ Successful: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failedPaths.length > 0) {
    console.log('\n⚠️  Failed paths:');
    failedPaths.forEach(path => console.log(`   - ${path}`));
  }

  console.log('\n✅ Archive folder creation complete!');
  console.log('\nNote: Some folders may already exist or may fail if the parent folder doesn\'t exist yet.');
  console.log('This is normal - you can create parent folders first by uploading files to them.');
}

// Run the script
createArchiveFolders().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

