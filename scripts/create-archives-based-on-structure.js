/**
 * Script to create archive folders based on actual blob structure
 * First analyzes what exists, then creates corresponding archive folders
 * Usage: node scripts/create-archives-based-on-structure.js
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { list, put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

async function createArchiveFolders() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  
  if (!token) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN not found in .env file');
    process.exit(1);
  }

  console.log('🔍 Step 1: Analyzing existing blob structure...\n');

  try {
    // List all files to understand the structure
    const { blobs } = await list({ token });
    
    console.log(`📁 Found ${blobs.length} total files\n`);

    // Filter out metadata, JSON, and existing archive folders
    const documentBlobs = blobs.filter(blob => {
      const p = (blob.pathname || '');
      if (p.startsWith('_metadata/')) return false;
      if (p.toLowerCase().endsWith('.json')) return false;
      const pathParts = p.split('/').filter(part => part && part !== '');
      const hasArchiveFolder = pathParts.some(part => 
        part.toUpperCase().includes('ARCHIVE') || 
        part.toUpperCase().endsWith('_ARCHIVE')
      );
      if (hasArchiveFolder) return false;
      return true;
    });

    console.log(`📄 Found ${documentBlobs.length} document files (excluding metadata and archives)\n`);

    // Analyze structure: Extract states and their subfolders
    const stateSubfolderMap = {};
    const allSubfolders = new Set();

    documentBlobs.forEach(blob => {
      const pathname = blob.pathname || '';
      const parts = pathname.split('/').filter(part => part && part !== '');
      
      if (parts.length >= 2) {
        const state = parts[0];
        const subfolder = parts[1];
        
        if (!stateSubfolderMap[state]) {
          stateSubfolderMap[state] = new Set();
        }
        stateSubfolderMap[state].add(subfolder);
        allSubfolders.add(subfolder);
      }
    });

    const states = Object.keys(stateSubfolderMap).sort();
    
    console.log('📊 ANALYSIS RESULTS:');
    console.log('='.repeat(80));
    console.log(`States found: ${states.length}`);
    console.log(`Unique subfolders: ${Array.from(allSubfolders).sort().join(', ')}\n`);

    // Display structure
    console.log('📂 Current Structure:');
    states.forEach(state => {
      const subfolders = Array.from(stateSubfolderMap[state]).sort();
      console.log(`  ${state}: ${subfolders.join(', ')}`);
    });

    console.log('\n\n🚀 Step 2: Creating archive folders...\n');

    // Create archive folders
    let total = 0;
    let success = 0;
    let failed = 0;
    const failedPaths = [];
    const createdPaths = [];

    for (const state of states) {
      const subfolders = Array.from(stateSubfolderMap[state]);
      
      for (const subfolder of subfolders) {
        const archivePath = `${state}/${subfolder}_ARCHIVE/.gitkeep`;
        total++;

        // Check if archive folder already exists
        const archiveExists = blobs.some(blob => {
          const p = blob.pathname || '';
          return p.startsWith(`${state}/${subfolder}_ARCHIVE/`);
        });

        if (archiveExists) {
          console.log(`⏭️  Skipping: ${archivePath} (already exists)`);
          continue;
        }

        process.stdout.write(`Creating: ${archivePath}... `);

        try {
          // Create a small placeholder file
          const placeholder = new Blob(['Archive folder placeholder'], { type: 'text/plain' });
          
          await put(archivePath, placeholder, {
            access: 'public',
            token: token
          });

          console.log('✅');
          success++;
          createdPaths.push(archivePath);
        } catch (error) {
          console.log('❌');
          console.error(`   Error: ${error.message}`);
          failed++;
          failedPaths.push(archivePath);
        }
      }
    }

    console.log('\n\n📊 SUMMARY:');
    console.log('='.repeat(80));
    console.log(`Total archive folders to create: ${total}`);
    console.log(`✅ Successfully created: ${success}`);
    console.log(`⏭️  Already existed: ${total - success - failed}`);
    console.log(`❌ Failed: ${failed}`);

    if (createdPaths.length > 0) {
      console.log('\n✅ Created archive folders:');
      createdPaths.forEach(p => console.log(`   - ${p}`));
    }

    if (failedPaths.length > 0) {
      console.log('\n❌ Failed to create:');
      failedPaths.forEach(p => console.log(`   - ${p}`));
    }

    // Save results
    const results = {
      timestamp: new Date().toISOString(),
      states: states,
      subfolders: Array.from(allSubfolders).sort(),
      stateSubfolderMap: Object.fromEntries(
        Object.entries(stateSubfolderMap).map(([state, subfolders]) => [
          state,
          Array.from(subfolders).sort()
        ])
      ),
      created: createdPaths,
      failed: failedPaths,
      stats: {
        total,
        success,
        failed,
        alreadyExisted: total - success - failed
      }
    };

    const outputPath = path.join(__dirname, 'archive-creation-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n✅ Results saved to: ${outputPath}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.message.includes('Access denied')) {
      console.error('\n💡 Tip: Check that BLOB_READ_WRITE_TOKEN in .env is valid and has write permissions');
    }
    process.exit(1);
  }
}

createArchiveFolders();

