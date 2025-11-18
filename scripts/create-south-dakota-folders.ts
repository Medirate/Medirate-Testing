/**
 * Script to create South Dakota folder structure in blob storage and local
 * Creates: ABA, BH, BILLING_MANUALS, IDD, HCBS and their archive folders
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local') });

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_4LG8E3vDGMaHJ6If_LlPD905PAzWrgVP3c9G3O7HvaqAgsy';
const LOCAL_PATH = '/home/dev/Desktop/Work Projects/Medirate/Document Library/MEDIRATE';
const STATE = 'SOUTH DAKOTA';
const STATE_PATH = 'SOUTH DAKOTA'; // For blob storage (no spaces in path)

// Common subfolders
const SUBFOLDERS = ['ABA', 'BH', 'BILLING_MANUALS', 'IDD', 'HCBS'];

async function createSouthDakotaFolders() {
  try {
    console.log(`📁 Creating ${STATE} folder structure...\n`);
    
    // Step 1: Create folders in local
    console.log('📁 Step 1: Creating folders in local Document Library...');
    const localBasePath = path.join(LOCAL_PATH, STATE);
    
    for (const subfolder of SUBFOLDERS) {
      // Create main subfolder
      const subfolderPath = path.join(localBasePath, subfolder);
      if (!fs.existsSync(subfolderPath)) {
        fs.mkdirSync(subfolderPath, { recursive: true });
        console.log(`   ✅ Created: ${STATE}/${subfolder}/`);
      } else {
        console.log(`   ℹ️  Already exists: ${STATE}/${subfolder}/`);
      }
      
      // Create archive subfolder
      const archiveSubfolderPath = path.join(localBasePath, `${subfolder}_ARCHIVE`);
      if (!fs.existsSync(archiveSubfolderPath)) {
        fs.mkdirSync(archiveSubfolderPath, { recursive: true });
        console.log(`   ✅ Created: ${STATE}/${subfolder}_ARCHIVE/`);
      } else {
        console.log(`   ℹ️  Already exists: ${STATE}/${subfolder}_ARCHIVE/`);
      }
    }
    
    // Step 2: Create folders in blob storage (by creating placeholder files)
    console.log('\n☁️  Step 2: Creating folders in Vercel Blob Storage...');
    
    for (const subfolder of SUBFOLDERS) {
      // Create main subfolder placeholder
      const subfolderBlobPath = `${STATE_PATH}/${subfolder}/.gitkeep`;
      try {
        const placeholder = new Blob(['Folder placeholder'], { type: 'text/plain' });
        await put(subfolderBlobPath, placeholder, {
          access: 'public',
          token: TOKEN
        });
        console.log(`   ✅ Created in blob: ${STATE_PATH}/${subfolder}/`);
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ℹ️  Already exists in blob: ${STATE_PATH}/${subfolder}/`);
        } else {
          console.error(`   ❌ Failed to create ${STATE_PATH}/${subfolder}/:`, error.message);
        }
      }
      
      // Create archive subfolder placeholder
      const archiveBlobPath = `${STATE_PATH}/${subfolder}_ARCHIVE/.gitkeep`;
      try {
        const placeholder = new Blob(['Archive folder placeholder'], { type: 'text/plain' });
        await put(archiveBlobPath, placeholder, {
          access: 'public',
          token: TOKEN
        });
        console.log(`   ✅ Created in blob: ${STATE_PATH}/${subfolder}_ARCHIVE/`);
      } catch (error: any) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`   ℹ️  Already exists in blob: ${STATE_PATH}/${subfolder}_ARCHIVE/`);
        } else {
          console.error(`   ❌ Failed to create ${STATE_PATH}/${subfolder}_ARCHIVE/:`, error.message);
        }
      }
    }
    
    // Step 3: Summary
    console.log('\n📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`✅ Created folder structure for ${STATE}`);
    console.log(`\n📁 Main folders created:`);
    SUBFOLDERS.forEach(subfolder => {
      console.log(`   - ${STATE}/${subfolder}/`);
    });
    console.log(`\n📁 Archive folders created:`);
    SUBFOLDERS.forEach(subfolder => {
      console.log(`   - ${STATE}/${subfolder}_ARCHIVE/`);
    });
    console.log(`\n✅ Total: ${SUBFOLDERS.length * 2} folders (${SUBFOLDERS.length} main + ${SUBFOLDERS.length} archive)`);
    console.log('\n🎉 South Dakota folder structure created successfully!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Access denied')) {
      console.error('\n💡 Tip: Make sure your BLOB_READ_WRITE_TOKEN is valid.');
    }
    process.exit(1);
  }
}

// Run the script
createSouthDakotaFolders();

