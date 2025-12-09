/**
 * Migration Script: Vercel Blob → Google Drive
 * 
 * This script migrates all documents from Vercel Blob Storage to Google Drive.
 * It preserves the folder structure and file organization.
 * 
 * Usage:
 *   pnpm migrate:blob-to-drive
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { list } from '@vercel/blob';
import {
  findRootFolder,
  findOrCreateFolderPath,
  uploadFileToDrive,
} from '../src/lib/google-drive';

// Load environment variables from .env.local or .env
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

interface MigrationStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ file: string; error: string }>;
}

async function migrateFiles() {
  console.log('🚀 Starting migration from Vercel Blob to Google Drive...\n');

  const stats: MigrationStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Step 1: Get all files from Vercel Blob
    console.log('📥 Fetching files from Vercel Blob...');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required. Please add it to your .env or .env.local file.');
    }
    
    if (!blobToken.startsWith('vercel_blob_')) {
      console.warn('⚠️  Warning: Token format looks incorrect. Should start with "vercel_blob_"');
    }
    
    console.log(`   Token found: ${blobToken.substring(0, 20)}...`);
    console.log('   Attempting to list files...');
    
    // Try with explicit token first, fallback to environment variable
    let blobs;
    try {
      blobs = (await list({ token: blobToken })).blobs;
    } catch (error: any) {
      if (error.message?.includes('Access denied')) {
        console.error('❌ Access denied with provided token.');
        console.error('   This could mean:');
        console.error('   1. The token is invalid or expired');
        console.error('   2. The token doesn\'t have read permissions');
        console.error('   3. The token is for a different Vercel project');
        console.error('\n   Please get a fresh token from:');
        console.error('   Vercel Dashboard → Your Project → Storage → Blob → Settings');
        throw new Error('Invalid or expired BLOB_READ_WRITE_TOKEN. Please get a fresh token from Vercel.');
      }
      throw error;
    }
    
    console.log(`✅ Found ${blobs.length} files in Vercel Blob\n`);

    // Step 2: Find root folder in Google Drive
    const rootFolderName = process.env.GOOGLE_DRIVE_ROOT_FOLDER || 'MediRate Documents';
    console.log(`📁 Looking for root folder: "${rootFolderName}"...`);
    const rootFolderId = await findRootFolder(rootFolderName);
    
    if (!rootFolderId) {
      console.error(`❌ Root folder "${rootFolderName}" not found in Google Drive!`);
      console.error('   Please create it first and share it with the service account.');
      process.exit(1);
    }
    console.log(`✅ Found root folder (ID: ${rootFolderId})\n`);

    // Step 3: Filter files (exclude metadata, archives, billing manuals)
    const filesToMigrate = (blobs || []).filter(blob => {
      const p = (blob.pathname || '');
      
      // Exclude metadata folder
      if (p.startsWith('_metadata/')) {
        // But include the manual_billing_links.json file
        if (p.endsWith('manual_billing_links.json')) {
          return true;
        }
        return false;
      }
      
      // Exclude JSON files (except metadata)
      if (p.toLowerCase().endsWith('.json')) return false;
      
      // Exclude archive folders
      const pathParts = p.split('/').filter(part => part && part !== '');
      const hasArchiveFolder = pathParts.some(part => 
        part.toUpperCase().includes('ARCHIVE') || 
        part.toUpperCase().endsWith('_ARCHIVE')
      );
      if (hasArchiveFolder) return false;
      
      // Exclude BILLING_MANUALS
      const hasBillingManuals = pathParts.some(part => {
        const normalized = part.toUpperCase().replace(/[_\s-]/g, '');
        return normalized === 'BILLINGMANUALS' || 
               (part.toUpperCase().includes('BILLING') && part.toUpperCase().includes('MANUAL'));
      });
      if (hasBillingManuals) return false;
      
      return true;
    });

    stats.total = filesToMigrate.length;
    console.log(`📋 Files to migrate: ${stats.total}`);
    console.log(`   (Excluded: ${blobs.length - stats.total} files)\n`);

    // Step 4: Migrate each file
    console.log('🔄 Starting migration...\n');

    for (let i = 0; i < filesToMigrate.length; i++) {
      const blob = filesToMigrate[i];
      const pathname = blob.pathname || '';
      const fileName = pathname.split('/').pop() || 'unknown';
      
      try {
        // Extract folder path
        const pathParts = pathname.split('/').filter(part => part && part !== '');
        const folderPath = pathParts.length > 1 
          ? pathParts.slice(0, -1).join('/') 
          : '';

        // Handle metadata file specially
        if (pathname.startsWith('_metadata/')) {
          const metadataPath = pathParts.slice(0, -1).join('/'); // Remove filename
          const targetFolderId = metadataPath 
            ? await findOrCreateFolderPath(rootFolderId, metadataPath)
            : rootFolderId;

          // Download file from Vercel Blob
          const fileResponse = await fetch(blob.url);
          if (!fileResponse.ok) {
            throw new Error(`Failed to download: ${fileResponse.statusText}`);
          }
          const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

          // Upload to Google Drive
          await uploadFileToDrive(
            targetFolderId,
            fileName,
            fileBuffer,
            'application/json'
          );

          console.log(`✅ [${i + 1}/${stats.total}] ${pathname}`);
          stats.success++;
        } else {
          // Regular file migration
          const targetFolderId = folderPath 
            ? await findOrCreateFolderPath(rootFolderId, folderPath)
            : rootFolderId;

          // Download file from Vercel Blob
          const fileResponse = await fetch(blob.url);
          if (!fileResponse.ok) {
            throw new Error(`Failed to download: ${fileResponse.statusText}`);
          }
          
          // Determine MIME type from file extension
          const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
          const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'txt': 'text/plain',
            'json': 'application/json',
          };
          const mimeType = mimeTypes[fileExtension] || 'application/octet-stream';

          const fileBuffer = Buffer.from(await fileResponse.arrayBuffer());

          // Upload to Google Drive
          await uploadFileToDrive(
            targetFolderId,
            fileName,
            fileBuffer,
            mimeType
          );

          console.log(`✅ [${i + 1}/${stats.total}] ${pathname}`);
          stats.success++;
        }

        // Small delay to avoid rate limiting
        if (i < filesToMigrate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ [${i + 1}/${stats.total}] ${pathname}: ${errorMessage}`);
        stats.failed++;
        stats.errors.push({ file: pathname, error: errorMessage });
      }
    }

    // Step 5: Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total files:     ${stats.total}`);
    console.log(`✅ Successful:   ${stats.success}`);
    console.log(`❌ Failed:       ${stats.failed}`);
    console.log(`⏭️  Skipped:      ${stats.skipped}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(({ file, error }) => {
        console.log(`   - ${file}: ${error}`);
      });
    }

    if (stats.failed === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${stats.failed} errors.`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrateFiles().catch(console.error);
}

export { migrateFiles };

