/**
 * Script to compare local Document Library with Vercel Blob storage
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { list } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy';
const LOCAL_PATH = '/home/dev/Desktop/Work Projects/Medirate/Document Library';

const ALLOWED_EXTS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'];

function getAllLocalFiles(dir: string, basePath: string = ''): string[] {
  const files: string[] = [];
  
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
          // Remove MEDIRATE/ prefix if present for comparison
          let normalizedPath = relativePath.toUpperCase().replace(/\\/g, '/');
          if (normalizedPath.startsWith('MEDIRATE/')) {
            normalizedPath = normalizedPath.substring(9); // Remove "MEDIRATE/"
          }
          files.push(normalizedPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

async function compareLocalVsBlob() {
  try {
    console.log('🔍 Comparing Local Document Library with Vercel Blob Storage...\n');
    
    // Get local files
    console.log('📁 Scanning local directory...');
    const localFiles = getAllLocalFiles(LOCAL_PATH);
    console.log(`✅ Found ${localFiles.length} files in local directory\n`);
    
    // Get blob files
    console.log('☁️  Fetching files from Vercel Blob Storage...');
    const { blobs } = await list({ token: TOKEN });
    
    // Filter blob files (exclude metadata and archives)
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
      .map(blob => (blob.pathname || '').toUpperCase());
    
    console.log(`✅ Found ${blobFiles.length} files in blob storage\n`);
    
    // Compare
    const localSet = new Set(localFiles);
    const blobSet = new Set(blobFiles);
    
    // Files in local but not in blob
    const onlyInLocal = localFiles.filter(file => !blobSet.has(file));
    
    // Files in blob but not in local
    const onlyInBlob = blobFiles.filter(file => !localSet.has(file));
    
    // Common files
    const commonFiles = localFiles.filter(file => blobSet.has(file));
    
    // Summary
    console.log('📊 COMPARISON RESULTS');
    console.log('='.repeat(80));
    console.log(`Total files in local:     ${localFiles.length}`);
    console.log(`Total files in blob:      ${blobFiles.length}`);
    console.log(`Common files:             ${commonFiles.length}`);
    console.log(`Only in local:            ${onlyInLocal.length}`);
    console.log(`Only in blob:             ${onlyInBlob.length}`);
    console.log();
    
    if (onlyInLocal.length > 0) {
      console.log('📋 FILES ONLY IN LOCAL (not uploaded to blob):');
      console.log('='.repeat(80));
      onlyInLocal.slice(0, 20).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (onlyInLocal.length > 20) {
        console.log(`  ... and ${onlyInLocal.length - 20} more files`);
      }
      console.log();
    }
    
    if (onlyInBlob.length > 0) {
      console.log('☁️  FILES ONLY IN BLOB (not in local):');
      console.log('='.repeat(80));
      onlyInBlob.slice(0, 20).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (onlyInBlob.length > 20) {
        console.log(`  ... and ${onlyInBlob.length - 20} more files`);
      }
      console.log();
    }
    
    // Answer the question
    console.log('🎯 ANSWER:');
    console.log('='.repeat(80));
    if (localFiles.length > blobFiles.length) {
      const diff = localFiles.length - blobFiles.length;
      console.log(`✅ YES - Local folder has ${diff} MORE file(s) than blob storage`);
      console.log(`   Local: ${localFiles.length} files`);
      console.log(`   Blob:  ${blobFiles.length} files`);
    } else if (blobFiles.length > localFiles.length) {
      const diff = blobFiles.length - localFiles.length;
      console.log(`❌ NO - Blob storage has ${diff} MORE file(s) than local folder`);
      console.log(`   Local: ${localFiles.length} files`);
      console.log(`   Blob:  ${blobFiles.length} files`);
    } else {
      console.log(`✅ EQUAL - Both have the same number of files (${localFiles.length})`);
    }
    
  } catch (error: any) {
    console.error('❌ Error comparing:', error.message);
    if (error.message.includes('Access denied')) {
      console.error('\n💡 Tip: Make sure your BLOB_READ_WRITE_TOKEN is valid.');
    }
    process.exit(1);
  }
}

// Run the comparison
compareLocalVsBlob();

