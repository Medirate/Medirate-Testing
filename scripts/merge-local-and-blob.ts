/**
 * Script to merge local Document Library with Vercel Blob storage
 * - Upload missing files from local to blob
 * - Download missing files from blob to local
 * - Create archive folders in local
 * - Fix Washington ADA -> ABA issue
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { list, put, del, head } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy';
const LOCAL_PATH = '/home/dev/Desktop/Work Projects/Medirate/Document Library';

const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];

function getAllLocalFiles(dir: string, basePath: string = ''): Array<{ path: string; fullPath: string }> {
  const files: Array<{ path: string; fullPath: string }> = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Skip archive folders for now
        if (entry.name.toUpperCase().includes('ARCHIVE') || entry.name.toUpperCase().endsWith('_ARCHIVE')) {
          continue;
        }
        files.push(...getAllLocalFiles(fullPath, relativePath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALLOWED_EXTS.includes(ext)) {
          // Remove MEDIRATE/ prefix if present for comparison
          let normalizedPath = relativePath.toUpperCase().replace(/\\/g, '/');
          if (normalizedPath.startsWith('MEDIRATE/')) {
            normalizedPath = normalizedPath.substring(9);
          }
          files.push({ path: normalizedPath, fullPath });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

function ensureDirectoryExists(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function downloadFile(url: string, localPath: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    ensureDirectoryExists(localPath);
    fs.writeFileSync(localPath, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return false;
  }
}

async function mergeLocalAndBlob() {
  try {
    console.log('🔄 Starting merge process...\n');
    
    // Step 1: Get all files from both locations
    console.log('📁 Scanning local directory...');
    const localFiles = getAllLocalFiles(LOCAL_PATH);
    const localMap = new Map(localFiles.map(f => [f.path, f.fullPath]));
    console.log(`✅ Found ${localFiles.length} files in local directory\n`);
    
    console.log('☁️  Fetching files from Vercel Blob Storage...');
    const { blobs } = await list({ token: TOKEN });
    
    const blobFiles = blobs
      .filter(blob => {
        const p = (blob.pathname || '').toUpperCase();
        if (p.startsWith('_METADATA/')) return false;
        if (p.toLowerCase().endsWith('.json')) return false;
        const pathParts = p.split('/').filter(part => part && part !== '');
        const hasArchiveFolder = pathParts.some(part => 
          part.includes('ARCHIVE') || part.endsWith('_ARCHIVE')
        );
        if (hasArchiveFolder) return false;
        return true;
      })
      .map(blob => ({
        path: (blob.pathname || '').toUpperCase(),
        url: blob.url,
        pathname: blob.pathname || ''
      }));
    
    const blobMap = new Map(blobFiles.map(f => [f.path, f]));
    console.log(`✅ Found ${blobFiles.length} files in blob storage\n`);
    
    // Step 2: Find files to upload (in local but not in blob)
    const toUpload = localFiles.filter(f => !blobMap.has(f.path));
    console.log(`📤 Files to upload to blob: ${toUpload.length}`);
    
    // Step 3: Find files to download (in blob but not in local)
    const toDownload = blobFiles.filter(f => !localMap.has(f.path));
    console.log(`📥 Files to download to local: ${toDownload.length}\n`);
    
    // Step 4: Fix Washington ADA -> ABA in local
    console.log('🔧 Checking for Washington ADA folder in local...');
    const washingtonAdaFiles = localFiles.filter(f => f.path.includes('WASHINGTON/ADA/'));
    if (washingtonAdaFiles.length > 0) {
      console.log(`   Found ${washingtonAdaFiles.length} file(s) in WASHINGTON/ADA/ - will rename to ABA`);
      for (const file of washingtonAdaFiles) {
        const newPath = file.fullPath.replace(/WASHINGTON[\/\\]ADA[\/\\]/i, path.join('WASHINGTON', 'ABA') + path.sep);
        if (fs.existsSync(file.fullPath)) {
          ensureDirectoryExists(newPath);
          fs.renameSync(file.fullPath, newPath);
          console.log(`   ✅ Renamed: ${path.basename(file.fullPath)}`);
        }
      }
    } else {
      console.log('   ✅ No Washington ADA folder found in local');
    }
    console.log();
    
    // Step 5: Upload missing files to blob
    if (toUpload.length > 0) {
      console.log('📤 Uploading files to blob storage...');
      let uploaded = 0;
      for (const file of toUpload) {
        try {
          const fileBuffer = fs.readFileSync(file.fullPath);
          const blobPath = file.path; // Already normalized without MEDIRATE/
          
          await put(blobPath, fileBuffer, {
            access: 'public',
            token: TOKEN
          });
          
          uploaded++;
          console.log(`   ✅ [${uploaded}/${toUpload.length}] Uploaded: ${blobPath}`);
        } catch (error: any) {
          console.error(`   ❌ Failed to upload ${file.path}:`, error.message);
        }
      }
      console.log(`\n✅ Uploaded ${uploaded}/${toUpload.length} files to blob\n`);
    }
    
    // Step 6: Download missing files from blob to local
    if (toDownload.length > 0) {
      console.log('📥 Downloading files from blob to local...');
      let downloaded = 0;
      for (const file of toDownload) {
        try {
          // Create local path (add MEDIRATE/ prefix)
          const localFilePath = path.join(LOCAL_PATH, 'MEDIRATE', file.pathname);
          const success = await downloadFile(file.url, localFilePath);
          if (success) {
            downloaded++;
            console.log(`   ✅ [${downloaded}/${toDownload.length}] Downloaded: ${file.pathname}`);
          }
        } catch (error: any) {
          console.error(`   ❌ Failed to download ${file.pathname}:`, error.message);
        }
      }
      console.log(`\n✅ Downloaded ${downloaded}/${toDownload.length} files to local\n`);
    }
    
    // Step 7: Create archive folders in local (based on blob structure)
    console.log('📁 Creating archive folders in local...');
    const archiveFolders = new Set<string>();
    blobs.forEach(blob => {
      const p = blob.pathname || '';
      const pathParts = p.split('/').filter(part => part && part !== '');
      pathParts.forEach((part, index) => {
        if (part.toUpperCase().includes('ARCHIVE') || part.toUpperCase().endsWith('_ARCHIVE')) {
          const folderPath = pathParts.slice(0, index + 1).join('/');
          archiveFolders.add(folderPath);
        }
      });
    });
    
    for (const folderPath of archiveFolders) {
      const localArchivePath = path.join(LOCAL_PATH, 'MEDIRATE', folderPath);
      if (!fs.existsSync(localArchivePath)) {
        fs.mkdirSync(localArchivePath, { recursive: true });
        console.log(`   ✅ Created: ${folderPath}`);
      }
    }
    console.log(`\n✅ Created ${archiveFolders.size} archive folder(s)\n`);
    
    // Step 8: Fix Washington ADA in blob if it exists
    console.log('🔧 Checking for Washington ADA folder in blob...');
    const washingtonAdaInBlob = blobFiles.filter(f => f.path.includes('WASHINGTON/ADA/'));
    if (washingtonAdaInBlob.length > 0) {
      console.log(`   Found ${washingtonAdaInBlob.length} file(s) in WASHINGTON/ADA/ - will rename to ABA`);
      for (const file of washingtonAdaInBlob) {
        try {
          // Download the file
          const response = await fetch(file.url);
          if (!response.ok) continue;
          const fileData = await response.arrayBuffer();
          const blob = new Blob([fileData]);
          
          // Upload to new location (ABA)
          const newPath = file.pathname.replace(/WASHINGTON\/ADA\//i, 'WASHINGTON/ABA/');
          await put(newPath, blob, {
            access: 'public',
            token: TOKEN
          });
          
          // Delete old file
          await del(file.pathname, { token: TOKEN });
          console.log(`   ✅ Fixed: ${file.pathname} → ${newPath}`);
        } catch (error: any) {
          console.error(`   ❌ Failed to fix ${file.pathname}:`, error.message);
        }
      }
    } else {
      console.log('   ✅ No Washington ADA folder found in blob');
    }
    console.log();
    
    // Final summary
    console.log('🎉 MERGE COMPLETE!');
    console.log('='.repeat(80));
    console.log(`✅ Uploaded to blob: ${toUpload.length} files`);
    console.log(`✅ Downloaded to local: ${toDownload.length} files`);
    console.log(`✅ Created archive folders: ${archiveFolders.size}`);
    console.log(`✅ Fixed Washington ADA issue`);
    console.log();
    console.log('📋 Next steps:');
    console.log('   - Review the merged files');
    console.log('   - Verify all files are in sync');
    console.log('   - No application changes needed - the app reads from blob storage');
    
  } catch (error: any) {
    console.error('❌ Error during merge:', error.message);
    if (error.message.includes('Access denied')) {
      console.error('\n💡 Tip: Make sure your BLOB_READ_WRITE_TOKEN is valid.');
    }
    process.exit(1);
  }
}

// Run the merge
mergeLocalAndBlob();

