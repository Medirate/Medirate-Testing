/**
 * Comprehensive script to verify all states and files are in blob storage
 * and upload any missing files
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { list, put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy';
const LOCAL_PATH = '/home/dev/Desktop/Work Projects/Medirate/Document Library/MEDIRATE';

const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];

function getAllLocalFiles(dir: string, basePath: string = ''): Array<{ path: string; fullPath: string; blobPath: string }> {
  const files: Array<{ path: string; fullPath: string; blobPath: string }> = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Skip archive folders
        if (entry.name.toUpperCase().includes('ARCHIVE') || entry.name.toUpperCase().endsWith('_ARCHIVE')) {
          continue;
        }
        files.push(...getAllLocalFiles(fullPath, relativePath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALLOWED_EXTS.includes(ext)) {
          // Blob path is just the relative path (already has state/folder structure)
          const blobPath = relativePath;
          files.push({ 
            path: relativePath, 
            fullPath,
            blobPath
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

async function verifyAndSyncAllStates() {
  try {
    console.log('🔍 Comprehensive State and File Verification\n');
    console.log('='.repeat(80));
    
    // Step 1: Get all local files
    console.log('\n📁 Step 1: Scanning local Document Library...');
    const localFiles = getAllLocalFiles(LOCAL_PATH);
    console.log(`✅ Found ${localFiles.length} files in local directory\n`);
    
    // Group by state
    const localByState = new Map<string, Array<{ path: string; fullPath: string; blobPath: string }>>();
    localFiles.forEach(file => {
      const state = file.blobPath.split('/')[0];
      if (!localByState.has(state)) {
        localByState.set(state, []);
      }
      localByState.get(state)!.push(file);
    });
    
    console.log(`📊 Found ${localByState.size} states in local:`);
    Array.from(localByState.entries()).sort().forEach(([state, files]) => {
      console.log(`   - ${state}: ${files.length} files`);
    });
    
    // Step 2: Get all blob files
    console.log('\n☁️  Step 2: Fetching files from Vercel Blob Storage...');
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
        pathname: blob.pathname || '',
        pathnameUpper: (blob.pathname || '').toUpperCase(),
        url: blob.url
      }));
    
    console.log(`✅ Found ${blobFiles.length} files in blob storage\n`);
    
    // Group by state
    const blobByState = new Map<string, string[]>();
    blobFiles.forEach(file => {
      const state = file.pathname.split('/')[0];
      if (!blobByState.has(state)) {
        blobByState.set(state, []);
      }
      blobByState.get(state)!.push(file.pathnameUpper);
    });
    
    console.log(`📊 Found ${blobByState.size} states in blob:`);
    Array.from(blobByState.entries()).sort().forEach(([state, files]) => {
      console.log(`   - ${state}: ${files.length} files`);
    });
    
    // Step 3: Find missing files
    console.log('\n🔍 Step 3: Comparing and finding missing files...');
    const blobSet = new Set(blobFiles.map(f => f.pathnameUpper));
    
    const missingInBlob: Array<{ path: string; fullPath: string; blobPath: string }> = [];
    localFiles.forEach(file => {
      if (!blobSet.has(file.blobPath.toUpperCase())) {
        missingInBlob.push(file);
      }
    });
    
    console.log(`\n📤 Files missing in blob: ${missingInBlob.length}`);
    
    // Group missing files by state
    const missingByState = new Map<string, number>();
    missingInBlob.forEach(file => {
      const state = file.blobPath.split('/')[0];
      missingByState.set(state, (missingByState.get(state) || 0) + 1);
    });
    
    if (missingByState.size > 0) {
      console.log('\n📋 Missing files by state:');
      Array.from(missingByState.entries()).sort().forEach(([state, count]) => {
        console.log(`   - ${state}: ${count} file(s)`);
      });
    }
    
    // Step 4: Upload missing files
    if (missingInBlob.length > 0) {
      console.log(`\n📤 Step 4: Uploading ${missingInBlob.length} missing file(s) to blob storage...\n`);
      
      let uploaded = 0;
      let failed = 0;
      const failedFiles: string[] = [];
      
      for (const file of missingInBlob) {
        try {
          const fileBuffer = fs.readFileSync(file.fullPath);
          
          await put(file.blobPath, fileBuffer, {
            access: 'public',
            token: TOKEN
          });
          
          uploaded++;
          if (uploaded % 10 === 0 || uploaded === missingInBlob.length) {
            console.log(`   ✅ Uploaded ${uploaded}/${missingInBlob.length} files...`);
          }
        } catch (error: any) {
          failed++;
          failedFiles.push(file.blobPath);
          console.error(`   ❌ Failed: ${file.blobPath} - ${error.message}`);
        }
      }
      
      console.log(`\n✅ Upload complete!`);
      console.log(`   ✅ Successfully uploaded: ${uploaded}`);
      console.log(`   ❌ Failed: ${failed}`);
      
      if (failedFiles.length > 0) {
        console.log(`\n❌ Failed files:`);
        failedFiles.forEach(f => console.log(`   - ${f}`));
      }
    } else {
      console.log('\n✅ All files are already in blob storage!');
    }
    
    // Step 5: Final verification
    console.log('\n🔍 Step 5: Final verification...');
    const { blobs: finalBlobs } = await list({ token: TOKEN });
    const finalBlobFiles = finalBlobs
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
      });
    
    const finalByState = new Map<string, number>();
    finalBlobFiles.forEach(blob => {
      const state = (blob.pathname || '').split('/')[0];
      finalByState.set(state, (finalByState.get(state) || 0) + 1);
    });
    
    console.log(`\n📊 FINAL STATE SUMMARY:`);
    console.log('='.repeat(80));
    console.log(`Total files in blob: ${finalBlobFiles.length}`);
    console.log(`Total states: ${finalByState.size}\n`);
    
    console.log('States in blob storage:');
    Array.from(finalByState.entries()).sort().forEach(([state, count]) => {
      const localCount = localByState.get(state)?.length || 0;
      const status = localCount === count ? '✅' : localCount > count ? '⚠️' : '✅';
      console.log(`   ${status} ${state}: ${count} files (local: ${localCount})`);
    });
    
    // Check for states in local but not in blob
    const statesOnlyInLocal = Array.from(localByState.keys()).filter(state => !finalByState.has(state));
    if (statesOnlyInLocal.length > 0) {
      console.log(`\n⚠️  States in local but not in blob:`);
      statesOnlyInLocal.forEach(state => {
        console.log(`   - ${state}: ${localByState.get(state)?.length || 0} files`);
      });
    }
    
    // Check for states in blob but not in local
    const statesOnlyInBlob = Array.from(finalByState.keys()).filter(state => !localByState.has(state));
    if (statesOnlyInBlob.length > 0) {
      console.log(`\nℹ️  States in blob but not in local:`);
      statesOnlyInBlob.forEach(state => {
        console.log(`   - ${state}: ${finalByState.get(state) || 0} files`);
      });
    }
    
    console.log('\n🎉 Verification complete!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Access denied')) {
      console.error('\n💡 Tip: Make sure your BLOB_READ_WRITE_TOKEN is valid.');
    }
    process.exit(1);
  }
}

// Run the verification
verifyAndSyncAllStates();

